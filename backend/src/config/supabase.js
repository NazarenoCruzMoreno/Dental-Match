const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl        = process.env.SUPABASE_URL;
const supabaseAnonKey    = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL no definida en .env');
}

// ── Cliente principal del backend ────────────────────────────────────────────
// Usamos service_role para bypassar RLS — la seguridad la maneja nuestro
// middleware de auth (JWT + roleMiddleware), no las policies de Supabase.
// Si no hay service key, cae al anon (warning) y RLS bloqueará escrituras.
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey ?? supabaseAnonKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY no configurada — escrituras pueden fallar por RLS');
}

// Alias para que el código antiguo siga funcionando
const supabaseAdmin = supabase;

module.exports = { supabase, supabaseAdmin };
