// Errores de body-parser / raw-body: los provoca el cliente, no el servidor
const POR_TIPO = {
  'entity.parse.failed':   [400, 'El cuerpo de la petición no es un JSON válido'],
  'entity.too.large':      [413, 'El cuerpo de la petición es demasiado grande'],
  'parameters.too.many':   [413, 'La petición tiene demasiados parámetros'],
  'request.aborted':       [400, 'La petición fue cancelada'],
  'request.size.invalid':  [400, 'El tamaño de la petición no es válido'],
  'encoding.unsupported':  [415, 'Codificación no soportada'],
  'charset.unsupported':   [415, 'Charset no soportado'],
};

// Devuelve [status, mensaje] si el error es culpa del cliente; null si es un fallo nuestro
const errorDeCliente = (err) => {
  if (err.type && POR_TIPO[err.type]) return POR_TIPO[err.type];

  if (err.name === 'MulterError') {
    return err.code === 'LIMIT_FILE_SIZE'
      ? [413, 'La imagen supera el máximo de 10 MB']
      : [400, 'Archivo inválido'];
  }

  // Errores propios pensados para mostrarse tal cual (ej. fileFilter de upload.js)
  if (err.clientError) return [err.status ?? 400, err.message];

  const status = err.status ?? err.statusCode;
  if (status >= 400 && status < 500) return [status, 'Solicitud inválida'];
  return null;
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.message,
    });
  }

  const delCliente = errorDeCliente(err);
  if (delCliente) {
    const [status, error] = delCliente;
    console.warn(`[http ${status}] ${req.method} ${req.originalUrl} — ${err.type || err.code || err.name}`);
    return res.status(status).json({ error });
  }

  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
  });
};

module.exports = errorHandler;
