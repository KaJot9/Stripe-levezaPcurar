const tabela = document.getElementById('tabela-planos');
const modal = document.getElementById('plano-modal');
const form = document.getElementById('form-plano');
const erroEl = document.getElementById('plano-erro');

document.getElementById('btn-novo-plano').addEventListener('click', () => abrirModal());
document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);

async function carregarPlanos() {
  const res = await fetch('/api/admin/planos');
  if (res.status === 401) return (window.location.href = '/admin/login');
  const planos = await res.json();

  if (!planos.length) {
    tabela.innerHTML = '<tr><td colspan="7">Nenhum plano cadastrado.</td></tr>';
    return;
  }

  tabela.innerHTML = planos
    .map(
      (p) => `
    <tr>
      <td>${p.ordem_exibicao}</td>
      <td>${escapeHtml(p.nome)}</td>
      <td><code>${escapeHtml(p.price_id)}</code></td>
      <td>R$ ${Number(p.valor).toFixed(2).replace('.', ',')}</td>
      <td><a href="${p.link_grupo}" target="_blank" rel="noopener">Abrir link</a></td>
      <td><span class="badge ${p.ativo ? 'ativa' : 'cancelada'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <button class="btn pequeno secundario" onclick='editarPlano(${JSON.stringify(p)})'>Editar</button>
        <button class="btn pequeno secundario" data-toggle="${p.id}" data-ativo="${p.ativo}">${p.ativo ? 'Desativar' : 'Ativar'}</button>
        <button class="btn pequeno perigo" data-excluir="${p.id}">Excluir</button>
      </td>
    </tr>`
    )
    .join('');

  tabela.querySelectorAll('[data-toggle]').forEach((btn) =>
    btn.addEventListener('click', () => alternarStatus(btn.dataset.toggle, btn.dataset.ativo === 'true'))
  );
  tabela.querySelectorAll('[data-excluir]').forEach((btn) =>
    btn.addEventListener('click', () => excluirPlano(btn.dataset.excluir))
  );
}

function abrirModal(plano = null) {
  document.getElementById('plano-modal-titulo').textContent = plano ? 'Editar plano' : 'Novo plano';
  document.getElementById('plano-id').value = plano?.id || '';
  document.getElementById('plano-nome').value = plano?.nome || '';
  document.getElementById('plano-price-id').value = plano?.price_id || '';
  document.getElementById('plano-valor').value = plano?.valor || '';
  document.getElementById('plano-link').value = plano?.link_grupo || '';
  document.getElementById('plano-ordem').value = plano?.ordem_exibicao ?? 0;
  document.getElementById('plano-ativo').checked = plano ? plano.ativo : true;
  erroEl.classList.add('hidden');
  modal.classList.remove('hidden');
}

function editarPlano(plano) {
  abrirModal(plano);
}
window.editarPlano = editarPlano;

function fecharModal() {
  modal.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('plano-id').value;

  const payload = {
    nome: document.getElementById('plano-nome').value.trim(),
    price_id: document.getElementById('plano-price-id').value.trim(),
    valor: Number(document.getElementById('plano-valor').value),
    link_grupo: document.getElementById('plano-link').value.trim(),
    ordem_exibicao: Number(document.getElementById('plano-ordem').value) || 0,
    ativo: document.getElementById('plano-ativo').checked
  };

  try {
    const res = await fetch(id ? `/api/admin/planos/${id}` : '/api/admin/planos', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar plano.');

    fecharModal();
    carregarPlanos();
  } catch (err) {
    erroEl.textContent = err.message;
    erroEl.classList.remove('hidden');
  }
});

async function alternarStatus(id, ativoAtual) {
  await fetch(`/api/admin/planos/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ativo: !ativoAtual })
  });
  carregarPlanos();
}

async function excluirPlano(id) {
  if (!confirm('Tem certeza que deseja excluir este plano?')) return;
  await fetch(`/api/admin/planos/${id}`, { method: 'DELETE' });
  carregarPlanos();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

carregarPlanos();
