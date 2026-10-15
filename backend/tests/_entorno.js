// Se importa ANTES que cualquier módulo del backend.
// supabase.js carga el .env real (apunta a la base de producción); dotenv no pisa
// variables ya definidas, así que fijándolas acá ningún test puede tocar datos reales.
Object.assign(process.env, {
  SUPABASE_URL: 'http://127.0.0.1:9', // puerto descartado: si algo intentara usar la base, falla rápido
  SUPABASE_ANON_KEY: 'clave-de-prueba',
  SUPABASE_SERVICE_ROLE_KEY: 'clave-de-prueba',
  JWT_SECRET: 'secreto-solo-para-tests',
  PUSH_EXTRA_HOSTS: '',
});
