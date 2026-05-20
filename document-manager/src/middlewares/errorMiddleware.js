const multer = require('multer');

function notFound(req, res, next) {
  const error = new Error('Pagina no encontrada');
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  if (error instanceof multer.MulterError || error.message?.includes('Solo se permiten')) {
    req.flash('error', error.code === 'LIMIT_FILE_SIZE'
      ? 'El archivo no debe superar 15 MB.'
      : error.message);

    return res.redirect('/documents/create');
  }

  console.error(error);

  return res.status(status).render('errors/error', {
    title: status === 404 ? 'Pagina no encontrada' : 'Error del servidor',
    status,
    message: status === 404
      ? 'La ruta solicitada no existe.'
      : 'Ocurrio un error inesperado. Intenta nuevamente.'
  });
}

module.exports = {
  notFound,
  errorHandler
};
