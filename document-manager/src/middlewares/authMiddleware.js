function exposeUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  req.flash('error', 'Inicia sesion para continuar.');
  return res.redirect('/login');
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  return next();
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role)) {
      return next();
    }

    req.flash('error', 'No tienes permisos para acceder a esta seccion.');
    return res.redirect('/dashboard');
  };
}

module.exports = {
  exposeUser,
  ensureAuthenticated,
  redirectIfAuthenticated,
  requireRole
};
