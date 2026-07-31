/**
 * models/plan.model.js
 * Acesso direto à tabela "planos" no Supabase.
 * Nenhuma regra de negócio aqui — apenas queries.
 */

const supabase = require('../config/supabase');

const TABLE = 'planos';

async function findAll({ onlyActive = false } = {}) {
  let query = supabase.from(TABLE).select('*').order('ordem_exibicao', { ascending: true });
  if (onlyActive) query = query.eq('ativo', true);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function findById(id) {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Busca um plano pelo Price ID do Stripe.
 * Esta é a ÚNICA forma que o sistema usa para identificar qual plano
 * um pagamento se refere — nunca pelo valor.
 */
async function findByPriceId(priceId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('price_id', priceId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function create(plan) {
  const { data, error } = await supabase.from(TABLE).insert(plan).select().single();
  if (error) throw error;
  return data;
}

async function update(id, changes) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function remove(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}

async function count() {
  const { count: total, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return total || 0;
}

module.exports = {
  findAll,
  findById,
  findByPriceId,
  create,
  update,
  remove,
  count
};
