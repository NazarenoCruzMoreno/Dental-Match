const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.message,
    });
  }

  res.status(500).json({
    error: 'Error interno del servidor',
  });
};

module.exports = errorHandler;