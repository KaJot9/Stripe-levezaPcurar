/**
 * models/customer.model.js
 * Acesso direto à tabela "clientes" no Supabase.
 * Nenhuma regra de negócio aqui — apenas queries.
 */

const supabase = require('../config/supabase');

const TABLE = 'clientes';

async function findBySubscriptionId(subscriptionId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findByStripeCustomerId(stripeCustomerId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function create(customer) {
  const { data, error } = await supabase.from(TABLE).insert(customer).select().single();
  if (error) throw error;
  return data;
}

async function updateBySubscriptionId(subscriptionId, changes) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(changes)
    .eq('subscription_id', subscriptionId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateById(id, changes) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Lista clientes com paginação e busca opcional por nome/e-mail.
 */
async function findAll({ page = 1, pageSize = 20, search = '' } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLE)
    .select('*, planos(nome)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
}

async function countByStatus(status) {
  const { count: total, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('status', status);
  if (error) throw error;
  return total || 0;
}

async function countAll() {
  const { count: total, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return total || 0;
}

module.exports = {
  findBySubscriptionId,
  findByStripeCustomerId,
  create,
  updateBySubscriptionId,
  updateById,
  findAll,
  countByStatus,
  countAll
};
