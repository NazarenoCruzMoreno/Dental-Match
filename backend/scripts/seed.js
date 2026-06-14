// ──────────────────────────────────────────────────────────────────────────────
//  Seed de usuarios de prueba — corré con `node scripts/seed.js`
//
//  Crea 4 pacientes y 4 estudiantes con perfil completo + algunos casos
//  para que puedas probar todos los flujos sin registrar cuentas a mano.
//
//  Si ya existen los usuarios, los reutiliza (no falla).
// ──────────────────────────────────────────────────────────────────────────────
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabase } = require('../src/config/supabase');

const PASSWORD = 'test1234'; // misma para todos los seeds

// ── Estudiantes ───────────────────────────────────────────────────────────────
const ESTUDIANTES = [
  {
    email: 'lucia@test.com',
    nombre: 'Lucía Martínez',
    universidad: 'UBA Odontología',
    anio_carrera: 2,
    descripcion: 'Estudiante de 2do año buscando práctica con pacientes. Especialmente interesada en odontología general y prevención.',
    materias: ['Odontología preventiva', 'Cariología'],
    disponibilidad: ['Lunes Mañana (9-13hs)', 'Miércoles Tarde (14-18hs)'],
  },
  {
    email: 'matias@test.com',
    nombre: 'Matías Gómez',
    universidad: 'UNLP Odontología',
    anio_carrera: 3,
    descripcion: 'Tercer año, me apasiona la endodoncia y trabajo en clínica. Disponible los fines de semana.',
    materias: ['Endodoncia', 'Cirugía oral'],
    disponibilidad: ['Sábado Mañana (9-13hs)', 'Sábado Tarde (14-18hs)'],
  },
  {
    email: 'carolina@test.com',
    nombre: 'Carolina Pereyra',
    universidad: 'UNC Odontología',
    anio_carrera: 5,
    descripcion: 'Pronta a recibirme. Especialidad en ortodoncia y cirugía. Atiendo casos complejos.',
    materias: ['Ortodoncia', 'Cirugía oral', 'Periodoncia'],
    disponibilidad: ['Martes Mañana (9-13hs)', 'Jueves Tarde (14-18hs)', 'Viernes Mañana (9-13hs)'],
  },
  {
    email: 'tomas@test.com',
    nombre: 'Tomás Rivera',
    universidad: 'UBA Odontología',
    anio_carrera: 1,
    descripcion: 'Primer año, busco hacer mis primeras prácticas con casos de análisis y diagnóstico inicial.',
    materias: ['Anatomía dental'],
    disponibilidad: ['Lunes Tarde (14-18hs)', 'Miércoles Mañana (9-13hs)'],
  },
];

// ── Pacientes ─────────────────────────────────────────────────────────────────
const PACIENTES = [
  {
    email: 'nora@test.com',
    nombre: 'Nora Fernández',
    edad: 34,
    telefono: '+54 9 11 5555-1111',
    problemaDental: 'Sensibilidad al frío en muelas superiores desde hace 2 semanas.',
  },
  {
    email: 'pablo@test.com',
    nombre: 'Pablo Sánchez',
    edad: 28,
    telefono: '+54 9 11 5555-2222',
    problemaDental: 'Dolor agudo en muela del juicio inferior izquierda. Inflamación.',
  },
  {
    email: 'ana@test.com',
    nombre: 'Ana Torres',
    edad: 45,
    telefono: '',
    problemaDental: 'Mancha oscura en incisivo central. Posible caries que se ve a simple vista.',
  },
  {
    email: 'leo@test.com',
    nombre: 'Leo Castro',
    edad: 22,
    telefono: '+54 9 11 5555-4444',
    problemaDental: 'Quiero un chequeo general, no me reviso los dientes hace 3 años.',
  },
];

// ── Casos a publicar (paciente, datos del caso) ──────────────────────────────
const CASOS = [
  {
    pacienteEmail: 'nora@test.com',
    titulo: 'Sensibilidad fría en molares superiores',
    descripcion: 'Hace dos semanas que cuando tomo agua fría o helado siento un dolor agudo y rápido en las muelas de arriba del lado derecho. Pasa y vuelve. Me preocupa que sea caries.',
    es_analisis: false,
  },
  {
    pacienteEmail: 'leo@test.com',
    titulo: 'Chequeo general — primera vez en años',
    descripcion: 'No me reviso los dientes hace 3 años, quiero hacerme una limpieza y que me digan si tengo algún problema antes de que se complique. No me duele nada.',
    es_analisis: true, // análisis para estudiante junior
  },
  {
    pacienteEmail: 'pablo@test.com',
    titulo: 'Dolor de muela del juicio',
    descripcion: 'Dolor muy fuerte en la muela del juicio inferior izquierda. Hace 5 días que aumenta. La encía está hinchada y enrojecida. No puedo masticar de ese lado.',
    es_analisis: false,
  },
  {
    pacienteEmail: 'ana@test.com',
    titulo: 'Posible caries en diente del frente',
    descripcion: 'Tengo una mancha marrón oscura en el diente de adelante que se ve. No me duele pero estéticamente me molesta y temo que sea caries avanzada.',
    es_analisis: false,
  },
];

// ── Helper: crear usuario (idempotente) ──────────────────────────────────────
async function upsertUsuario(email, role) {
  const { data: existing } = await supabase
    .from('users').select('id, email, role').eq('email', email).maybeSingle();
  if (existing) return existing;

  const password = await bcrypt.hash(PASSWORD, 10);
  const { data, error } = await supabase
    .from('users').insert({ email, password, role }).select('id, email, role').single();
  if (error) throw error;
  return data;
}

// ── Helper: crear perfil estudiante ──────────────────────────────────────────
async function upsertEstudiante(user, profile) {
  const { data: existing } = await supabase
    .from('estudiantes').select('id').eq('user_id', user.id).maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('estudiantes').insert({
      user_id: user.id, email: user.email,
      nombre: profile.nombre, universidad: profile.universidad,
      anio_carrera: profile.anio_carrera,
      materias: profile.materias, disponibilidad: profile.disponibilidad,
      descripcion: profile.descripcion,
    }).select('id').single();
  if (error) throw error;
  return data;
}

// ── Helper: crear perfil paciente ────────────────────────────────────────────
async function upsertPaciente(user, profile) {
  const { data: existing } = await supabase
    .from('pacientes').select('id').eq('user_id', user.id).maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('pacientes').insert({
      user_id: user.id, email: user.email,
      nombre: profile.nombre, edad: profile.edad,
      telefono: profile.telefono || null,
      problema_dental: profile.problemaDental,
    }).select('id').single();
  if (error) throw error;
  return data;
}

// ── Run ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('🌱 Iniciando seed...\n');

  // 1) Estudiantes
  console.log('👨‍🎓 Creando estudiantes...');
  const estudiantesCreados = {};
  for (const e of ESTUDIANTES) {
    const user = await upsertUsuario(e.email, 'estudiante');
    const perfil = await upsertEstudiante(user, e);
    estudiantesCreados[e.email] = perfil;
    console.log(`   ✓ ${e.email}`);
  }

  // 2) Pacientes
  console.log('\n🧑‍⚕️  Creando pacientes...');
  const pacientesCreados = {};
  for (const p of PACIENTES) {
    const user = await upsertUsuario(p.email, 'paciente');
    const perfil = await upsertPaciente(user, p);
    pacientesCreados[p.email] = perfil;
    console.log(`   ✓ ${p.email}`);
  }

  // 3) Casos
  console.log('\n🦷 Publicando casos...');
  for (const c of CASOS) {
    const paciente = pacientesCreados[c.pacienteEmail];
    if (!paciente) continue;
    const { data: existing } = await supabase
      .from('casos').select('id').eq('paciente_id', paciente.id).eq('titulo', c.titulo).maybeSingle();
    if (existing) { console.log(`   ↪ "${c.titulo}" (ya existía)`); continue; }
    await supabase.from('casos').insert({
      paciente_id: paciente.id,
      titulo: c.titulo, descripcion: c.descripcion,
      es_analisis: c.es_analisis, estado: 'abierto',
    });
    console.log(`   ✓ "${c.titulo}"`);
  }

  console.log('\n✅ Seed completo.\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 CUENTAS DE PRUEBA (password en todas: test1234)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎓 ESTUDIANTES:');
  ESTUDIANTES.forEach(e => console.log(`   ${e.email.padEnd(28)} — ${e.nombre} (año ${e.anio_carrera})`));
  console.log('\n👤 PACIENTES:');
  PACIENTES.forEach(p => console.log(`   ${p.email.padEnd(28)} — ${p.nombre} (${p.edad} años)`));
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch((e) => { console.error('❌ Error en seed:', e.message); process.exit(1); });
