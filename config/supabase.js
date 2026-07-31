/**
 * config/supabase.js
 * Instância única do cliente Supabase (service role), usada apenas no backend.
 * NUNCA exponha a service_role key no frontend.
 */

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
