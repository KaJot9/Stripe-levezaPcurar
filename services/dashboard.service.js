/**
 * services/dashboard.service.js
 * Agrega estatísticas para o painel administrativo.
 */

const customerModel = require('../models/customer.model');
const planModel = require('../models/plan.model');
const supabase = require('../config/supabase');

async function obterEstatisticas() {
  const [totalClientes, ativas, canceladas, inadimplentes, totalPlanos] = await Promise.all([
    customerModel.countAll(),
    customerModel.countByStatus('ativa'),
    customerModel.countByStatus('cancelada'),
    customerModel.countByStatus('inadimplente'),
    planModel.count()
  ]);

  // Faturamento estimado: soma do valor dos planos das assinaturas ativas.
  const { data: faturamentoRows, error } = await supabase
    .from('clientes')
    .select('planos(valor)')
    .eq('status', 'ativa');

  if (error) throw error;

  const faturamentoMensal = (faturamentoRows || []).reduce(
    (soma, row) => soma + (row.planos?.valor ? Number(row.planos.valor) : 0),
    0
  );

  return {
    totalClientes,
    assinaturasAtivas: ativas,
    assinaturasCanceladas: canceladas,
    assinaturasInadimplentes: inadimplentes,
    totalPlanos,
    faturamentoMensal
  };
}

module.exports = { obterEstatisticas };
