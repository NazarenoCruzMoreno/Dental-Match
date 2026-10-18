// Una URL pública de Supabase Storage tiene la forma
//   https://<proyecto>.supabase.co/storage/v1/object/public/<bucket>/<ruta/del/archivo>
// Devuelve { bucket, ruta } o null si no es una URL de Storage.
const rutaEnStorage = (url) => {
  const coincide = typeof url === 'string' && url.match(/\/object\/public\/([^/]+)\/([^?#]+)/);
  if (!coincide) return null;
  return { bucket: coincide[1], ruta: decodeURIComponent(coincide[2]) };
};

module.exports = { rutaEnStorage };
