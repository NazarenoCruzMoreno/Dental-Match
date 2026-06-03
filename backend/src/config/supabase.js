const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL o SUPABASE_ANON_KEY no definidas en .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
