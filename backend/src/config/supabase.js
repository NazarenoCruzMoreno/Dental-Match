const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl         = process.env.SUPABASE_URL;
const supabaseAnonKey     = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE_URL o SUPABASE_ANON_KEY no definidas en .env');
}

// Cliente normal: respeta RLS — usar para queries comunes
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin: bypassa RLS — usar SOLO en backend para storage y operaciones privilegiadas
// Si la service key no está configurada, cae al cliente normal con un warning
let supabaseAdmin;
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} else {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY no configurada — uploads pueden fallar por RLS');
  supabaseAdmin = supabase;
}

module.exports = { supabase, supabaseAdmin };
