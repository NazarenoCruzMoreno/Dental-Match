const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');

// ── Config de multer (memoria + límites + filtro de tipo) ────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'), false);
  },
});

const BUCKET = 'dental-match';

// ── Sube el archivo a Supabase Storage y deja la URL en req.imageUrl ─────────
const uploadToStorage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const ext      = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `pacientes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload] Supabase Storage error:', uploadError);
      // Mensajes más claros según el caso
      if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === '404') {
        return res.status(500).json({
          error: `El bucket "${BUCKET}" no existe en Supabase Storage. Crealo desde el dashboard y marcalo como público.`,
        });
      }
      if (uploadError.message?.toLowerCase().includes('row-level security') ||
          uploadError.message?.toLowerCase().includes('unauthorized')) {
        return res.status(500).json({
          error: `El bucket "${BUCKET}" no tiene permisos públicos de escritura. Marcalo como Public en Supabase Storage.`,
        });
      }
      return res.status(500).json({ error: `Error de Storage: ${uploadError.message}` });
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
    req.imageUrl   = data.publicUrl;
    next();
  } catch (error) {
    console.error('[upload] Error inesperado:', error);
    res.status(500).json({ error: `Error procesando imagen: ${error.message}` });
  }
};

module.exports = { upload, uploadToStorage };
