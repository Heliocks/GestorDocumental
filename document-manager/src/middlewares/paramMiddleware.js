function validateIdParam(redirectPath) {
  return (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      req.flash('error', 'Identificador invalido.');
      return res.redirect(redirectPath);
    }

    return next();
  };
}

module.exports = {
  validateIdParam
};
