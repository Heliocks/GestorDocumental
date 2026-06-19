const crypto = require('crypto');
const { deleteFileIfExists } = require('../utils/files');

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

function attachCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  res.locals.csrfToken = req.session.csrfToken;
  next();
}

function csrfProtection(options = {}) {
  const skippedRoutes = options.skip || [];

  return async (req, res, next) => {
    if (safeMethods.has(req.method)) {
      return next();
    }

    const shouldSkip = skippedRoutes.some((route) => {
      const methodMatches = route.method === req.method;
      const pathMatches = route.path instanceof RegExp
        ? route.path.test(req.path)
        : route.path === req.path;

      return methodMatches && pathMatches;
    });

    if (shouldSkip) {
      return next();
    }

    const token = req.body?._csrf || req.get('x-csrf-token');

    if (token && token === req.session.csrfToken) {
      return next();
    }

    await deleteFileIfExists(req.file?.path);
    req.flash('error', 'La solicitud expiro o no es valida. Intenta nuevamente.');
    return res.redirect(req.get('referer') || '/dashboard');
  };
}

module.exports = {
  attachCsrfToken,
  csrfProtection
};
