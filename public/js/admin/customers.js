const tabela = document.getElementById('tabela-clientes');
const buscaInput = document.getElementById('busca-cliente');
const paginacaoEl = document.getElementById('paginacao');

let paginaAtual = 1;
let timerBusca = null;

async function carregarClientes(page = 1) {
  paginaAtual = page;
  const search = encodeURIComponent(buscaInput.value.trim());
  const res = await fetch(`/api/admin/clientes?page=${page}&pageSize=15&search=${search}`);
  if (res.status === 401) return (window.location.href = '/admin/login');
  const { data, pagination } = await res.json();

  if (!data.length) {
    tabela.innerHTML = '<tr><td colspan="5">Nenhum cliente encontrado.</td></tr>';
    paginacaoEl.innerHTML = '';
    return;
  }

  tabela.innerHTML = data
    .map(
      (c) => `
    <tr>
      <td>${escapeHtml(c.nome || '-')}</td>
      <td>${escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.planos?.nome || '-')}</td>
      <td><span class="badge ${c.status}">${traduzirStatus(c.status)}</span></td>
      <td>${new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
    </tr>`
    )
    .join('');

  renderPaginacao(pagination);
}

function traduzirStatus(status) {
  const map = { ativa: 'Ativa', pendente: 'Pendente', inadimplente: 'Inadimplente', cancelada: 'Cancelada' };
  return map[status] || status;
}

function renderPaginacao(pagination) {
  if (pagination.totalPages <= 1) {
    paginacaoEl.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 1; i <= pagination.totalPages; i++) {
    html += `<button class="${i === pagination.page ? 'ativo' : ''}" data-page="${i}">${i}</button>`;
  }
  paginacaoEl.innerHTML = html;
  paginacaoEl.querySelectorAll('[data-page]').forEach((btn) =>
    btn.addEventListener('click', () => carregarClientes(Number(btn.dataset.page)))
  );
}

buscaInput.addEventListener('input', () => {
  clearTimeout(timerBusca);
  timerBusca = setTimeout(() => carregarClientes(1), 350);
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

carregarClientes();
