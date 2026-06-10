const multer = require('multer');
const crypto = require('crypto');
const { supabase } = require('../config/supabase');

// ── Config de multer (memoria + límites + filtro de tipo) ────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'), false);
  },
});

const BUCKET = 'dental-match';

// ── Calcula SHA-256 del buffer ───────────────────────────────────────────────
const hashBuffer = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex');

// ── Sube el archivo a Supabase Storage y deja la URL en req.imageUrl ─────────
// Si ya existe una imagen con el mismo hash, reutiliza la URL existente.
const uploadToStorage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const hash = hashBuffer(req.file.buffer);

    // 1) ¿Ya existe esta imagen?
    const { data: existing } = await supabase
      .from('image_hashes')
      .select('url')
      .eq('hash', hash)
      .maybeSingle();

    if (existing?.url) {
      console.log(`[upload] Imagen duplicada detectada (hash ${hash.slice(0, 8)}), reutilizando URL`);
      req.imageUrl = existing.url;
      return next();
    }

    // 2) Subir al storage
    const ext      = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `casos/${hash.slice(0, 16)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError && !uploadError.message?.includes('already exists')) {
      console.error('[upload] Supabase Storage error:', uploadError);
      if (uploadError.message?.includes('Bucket not found')) {
        return res.status(500).json({ error: `El bucket "${BUCKET}" no existe en Supabase Storage.` });
      }
      return res.status(500).json({ error: `Error de Storage: ${uploadError.message}` });
    }

    // 3) Obtener URL pública
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    // 4) Guardar en image_hashes para futuras dedupes
    await supabase
      .from('image_hashes')
      .insert({ hash, url: publicUrl })
      .then(() => {})
      .catch(() => {}); // si la tabla no existe no rompe

    req.imageUrl = publicUrl;
    next();
  } catch (error) {
    console.error('[upload] Error inesperado:', error);
    res.status(500).json({ error: `Error procesando imagen: ${error.message}` });
  }
};

module.exports = { upload, uploadToStorage };
