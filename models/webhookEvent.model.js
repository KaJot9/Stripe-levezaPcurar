/**
 * models/webhookEvent.model.js
 * Controla quais eventos do Stripe já foram processados, evitando
 * duplicidade caso o Stripe reenvie o mesmo evento (isso é comum e esperado).
 */

const supabase = require('../config/supabase');

const TABLE = 'eventos_webhook';

async function jaProcessado(eventId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .eq('id', eventId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function registrar(eventId, tipo, livemode, processado_em, status) {
  // Se já existir (corrida concorrente), ignora o erro de duplicidade.
  const { error } = await supabase.from(TABLE).insert({ id: eventId, tipo });
  if (error && error.code !== '23505') throw error; // 23505 = unique_violation
}

module.exports = { jaProcessado, registrar };
