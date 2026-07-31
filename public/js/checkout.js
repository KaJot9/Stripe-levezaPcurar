/**
 * public/js/checkout.js
 * Busca os planos ativos na API e renderiza os cards dinamicamente.
 * Nenhum plano é "hardcoded" aqui — adicionar planos no admin já reflete
 * automaticamente nesta página.
 */

const planosContainer = document.getElementById('planos');
const modal = document.getElementById('email-modal');
const emailInput = document.getElementById('email-input');
const emailErro = document.getElementById('email-erro');
const btnCancelar = document.getElementById('btn-cancelar');
const btnContinuar = document.getElementById('btn-continuar');

let priceIdSelecionado = null;

async function carregarPlanos() {
  try {
    const res = await fetch('/api/planos');
    if (!res.ok) throw new Error('Falha ao carregar planos');
    const planos = await res.json();

    if (!planos.length) {
      planosContainer.innerHTML = '<p class="erro-carregamento">Nenhum plano disponível no momento.</p>';
      return;
    }

    planosContainer.innerHTML = planos
      .map(
        (plano) => `
        <div class="plano-card">
          <h3>${escapeHtml(plano.nome)}</h3>
          <div class="preco">R$ ${Number(plano.valor).toFixed(2).replace('.', ',')} <span>/mês</span></div>
          <button class="btn primario" data-price-id="${plano.price_id}">Assinar</button>
        </div>`
      )
      .join('');

    document.querySelectorAll('[data-price-id]').forEach((btn) => {
      btn.addEventListener('click', () => abrirModal(btn.dataset.priceId));
    });
  } catch (err) {
    planosContainer.innerHTML = '<p class="erro-carregamento">Não foi possível carregar os planos. Tente novamente em instantes.</p>';
    console.error(err);
  }
}

function abrirModal(priceId) {
  priceIdSelecionado = priceId;
  emailErro.classList.add('hidden');
  emailInput.value = '';
  modal.classList.remove('hidden');
}

function fecharModal() {
  modal.classList.add('hidden');
  priceIdSelecionado = null;
}

btnCancelar.addEventListener('click', fecharModal);

btnContinuar.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailErro.textContent = 'Informe um e-mail válido.';
    emailErro.classList.remove('hidden');
    return;
  }

  btnContinuar.disabled = true;
  btnContinuar.textContent = 'Redirecionando...';

  try {
    const res = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: priceIdSelecionado, email })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Erro ao iniciar pagamento.');

    window.location.href = data.url;
  } catch (err) {
    emailErro.textContent = err.message;
    emailErro.classList.remove('hidden');
    btnContinuar.disabled = false;
    btnContinuar.textContent = 'Continuar para pagamento';
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

carregarPlanos();
