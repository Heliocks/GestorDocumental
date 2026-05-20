const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { getValidationErrors } = require('../utils/validation');

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function showLogin(req, res) {
  return res.render('auth/login', {
    title: 'Iniciar sesion',
    formData: {}
  });
}

async function login(req, res) {
  const errors = getValidationErrors(req);

  if (errors.length) {
    return res.status(422).render('auth/login', {
      title: 'Iniciar sesion',
      errors,
      formData: req.body
    });
  }

  const user = await User.findAuthByEmail(req.body.email);
  const passwordMatches = user
    ? await bcrypt.compare(req.body.password, user.password_hash)
    : false;

  if (!user || !passwordMatches) {
    return res.status(401).render('auth/login', {
      title: 'Iniciar sesion',
      errors: ['Email o contrasena incorrectos.'],
      formData: { email: req.body.email }
    });
  }

  await regenerateSession(req);
  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  req.flash('success', `Bienvenido, ${user.name}.`);
  await saveSession(req);

  return res.redirect('/dashboard');
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('document_manager.sid');
    return res.redirect('/login');
  });
}

module.exports = {
  showLogin,
  login,
  logout
};
