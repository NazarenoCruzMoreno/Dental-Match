const multer = require('multer');
const { supabase } = require('../config/supabase');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo imágenes permitidas'), false);
    }
  },
});

const uploadToStorage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const ext = req.file.originalname.split('.').pop();
    const fileName = `pacientes/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('dental-match')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('dental-match')
      .getPublicUrl(fileName);

    req.imageUrl = data.publicUrl;
    next();
  } catch (error) {
    console.error('Error subiendo imagen:', error.message);
    res.status(500).json({ error: 'Error procesando imagen' });
  }
};

module.exports = { upload, uploadToStorage };
