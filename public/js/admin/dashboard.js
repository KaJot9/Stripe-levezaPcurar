async function carregarEstatisticas() {
  const container = document.getElementById('cards');
  try {
    const res = await fetch('/api/admin/dashboard/estatisticas');
    if (res.status === 401) return (window.location.href = '/admin/login');
    const stats = await res.json();

    const formatoMoeda = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

    container.innerHTML = `
      ${cardStat('Assinantes (total)', stats.totalClientes)}
      ${cardStat('Assinaturas ativas', stats.assinaturasAtivas)}
      ${cardStat('Assinaturas canceladas', stats.assinaturasCanceladas)}
      ${cardStat('Inadimplentes', stats.assinaturasInadimplentes)}
      ${cardStat('Faturamento mensal (MRR)', formatoMoeda(stats.faturamentoMensal))}
      ${cardStat('Planos cadastrados', stats.totalPlanos)}
    `;
  } catch (err) {
    container.innerHTML = '<p>Não foi possível carregar as estatísticas.</p>';
    console.error(err);
  }
}

function cardStat(label, valor) {
  return `<div class="card-stat"><div class="label">${label}</div><div class="valor">${valor}</div></div>`;
}

carregarEstatisticas();
