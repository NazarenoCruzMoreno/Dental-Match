const multer = require('multer');
const { bucket } = require('../config/firebase');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
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
    const fileName = `pacientes/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (error) => {
      console.error('Error uploading:', error);
      return res.status(500).json({ error: 'Error subiendo imagen' });
    });

    stream.on('finish', async () => {
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      req.imageUrl = publicUrl;
      next();
    });

    stream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: 'Error procesando imagen' });
  }
};

module.exports = { upload, uploadToStorage };