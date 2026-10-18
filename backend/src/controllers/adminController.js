const { supabase } = require('../config/supabase');
const { rutaEnStorage } = require('../utils/storage');

const ROLES = ['estudiante', 'paciente', 'admin'];
const LIMITE_USUARIOS = 200;
const LIMITE_CASOS = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Tablas que guardan una imagen_url: al moderar una imagen hay que limpiarla en todas
const TABLAS_CON_IMAGEN = ['casos', 'pacientes', 'estudiantes'];

const invalido = (res, mensaje) => res.status(400).json({ error: mensaje });

// ── GET /api/admin/stats ─────────────────────────────────────────────────────
const stats = async (req, res) => {
  try {
    const [estudiantes, pacientes, casos] = await Promise.all([
      supabase.from('estudiantes').select('*', { count: 'exact', head: true }),
      supabase.from('pacientes').select('*', { count: 'exact', head: true }),
      supabase.from('casos').select('*', { count: 'exact', head: true }),
    ]);

    const err = estudiantes.error || pacientes.error || casos.error;
    if (err) throw err;

    res.json({
      estudiantes: estudiantes.count ?? 0,
      pacientes:   pacientes.count ?? 0,
      casos:       casos.count ?? 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/admin/usuarios?rol=&q= ──────────────────────────────────────────
// Nunca se selecciona la columna password.
const listarUsuarios = async (req, res) => {
  try {
    const { rol, q } = req.query;
    if (rol && !ROLES.includes(rol)) return invalido(res, 'Rol no válido');

    let consulta = supabase
      .from('users')
      .select('id, email, role, email_verificado, created_at')
      .order('created_at', { ascending: false })
      .limit(LIMITE_USUARIOS);
    if (rol) consulta = consulta.eq('role', rol);
    if (typeof q === 'string' && q.trim()) consulta = consulta.ilike('email', `%${q.trim().replace(/[%_,()]/g, '')}%`);

    const { data: usuarios, error } = await consulta;
    if (error) throw error;

    // El nombre vive en el perfil (estudiantes o pacientes), no en users
    const ids = usuarios.map((u) => u.id);
    const [estudiantes, pacientes] = await Promise.all([
      supabase.from('estudiantes').select('user_id, nombre').in('user_id', ids),
      supabase.from('pacientes').select('user_id, nombre').in('user_id', ids),
    ]);
    const err = estudiantes.error || pacientes.error;
    if (err) throw err;

    const nombres = new Map([...estudiantes.data, ...pacientes.data].map((p) => [p.user_id, p.nombre]));
    res.json(usuarios.map((u) => ({ ...u, nombre: nombres.get(u.id) ?? null })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/admin/casos?imagen=1 ────────────────────────────────────────────
const listarCasos = async (req, res) => {
  try {
    let consulta = supabase
      .from('casos')
      .select('id, titulo, estado, imagen_url, created_at, pacientes(nombre, email)')
      .order('created_at', { ascending: false })
      .limit(LIMITE_CASOS);
    if (req.query.imagen === '1') consulta = consulta.not('imagen_url', 'is', null);

    const { data, error } = await consulta;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/admin/casos/:id ──────────────────────────────────────────────
// Las aplicaciones, asignaciones y mensajes del caso se borran en cascada.
const eliminarCaso = async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID.test(id)) return invalido(res, 'Id de caso no válido');

    const { data, error } = await supabase.from('casos').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'Caso no encontrado' });
    res.json({ message: 'Caso eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/admin/casos/:id/imagen ───────────────────────────────────────
// Retira la imagen de toda la plataforma: la imagen se comparte entre casos con
// el mismo contenido (se guarda por hash), así que no alcanza con limpiar uno.
const quitarImagenDeCaso = async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID.test(id)) return invalido(res, 'Id de caso no válido');

    const { data: caso, error } = await supabase.from('casos').select('imagen_url').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!caso) return res.status(404).json({ error: 'Caso no encontrado' });
    if (!caso.imagen_url) return invalido(res, 'El caso no tiene imagen');

    const url = caso.imagen_url;
    // Primero la base (así nadie queda con un enlace roto) y después el archivo
    for (const tabla of TABLAS_CON_IMAGEN) {
      const { error: errTabla } = await supabase.from(tabla).update({ imagen_url: null }).eq('imagen_url', url);
      if (errTabla) throw errTabla;
    }
    const { error: errHash } = await supabase.from('image_hashes').delete().eq('url', url);
    if (errHash) throw errHash;

    const archivo = rutaEnStorage(url);
    if (archivo) {
      const { error: errStorage } = await supabase.storage.from(archivo.bucket).remove([archivo.ruta]);
      if (errStorage) {
        return res.status(500).json({ error: `La imagen ya no se muestra, pero no se pudo borrar el archivo: ${errStorage.message}` });
      }
    }
    res.json({ message: 'Imagen eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { stats, listarUsuarios, listarCasos, eliminarCaso, quitarImagenDeCaso };
