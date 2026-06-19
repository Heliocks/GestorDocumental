require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const methodOverride = require('method-override');
const morgan = require('morgan');
const { pool } = require('./config/database');
const flashMiddleware = require('./middlewares/flashMiddleware');
const { attachCsrfToken, csrfProtection } = require('./middlewares/csrfMiddleware');
const {
  exposeUser,
  ensureAuthenticated,
  requireRole
} = require('./middlewares/authMiddleware');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const documentRoutes = require('./routes/documentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = Number(process.env.PORT || 3003);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.locals.appName = 'Gestor Documental';

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(methodOverride('_method'));
app.use('/css', express.static(path.join(__dirname, 'public', 'css'), {
  setHeaders: (res) => {
    res.type('text/css; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));
app.use('/js', express.static(path.join(__dirname, 'public', 'js'), {
  setHeaders: (res) => {
    res.type('application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  name: 'document_manager.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use(flashMiddleware);
app.use(exposeUser);
app.use(attachCsrfToken);
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.formatDate = (date) => new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
  res.locals.formatDateOnly = (date) => {
    if (!date) return '';
    const parsedDate = date instanceof Date
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
      : new Date(`${String(date).slice(0, 10)}T00:00:00`);
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(parsedDate);
  };
  res.locals.formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / (1024 ** index);
    return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };
  next();
});
app.use(csrfProtection({
  skip: [
    { method: 'POST', path: '/documents' },
    { method: 'PUT', path: /^\/documents\/\d+$/ }
  ]
}));

app.get('/', (req, res) => {
  return res.redirect(req.session.user ? '/dashboard' : '/login');
});

app.use('/', authRoutes);
app.use('/dashboard', ensureAuthenticated, dashboardRoutes);
app.use('/approvals', ensureAuthenticated, approvalRoutes);
app.use('/documents', ensureAuthenticated, documentRoutes);
app.use('/categories', ensureAuthenticated, requireRole('admin'), categoryRoutes);
app.use('/users', ensureAuthenticated, requireRole('admin'), userRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Document manager running at http://localhost:${port}`);
  });
}

module.exports = app;
