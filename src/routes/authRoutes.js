const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');
const {
  ensureAuthenticated,
  redirectIfAuthenticated
} = require('../middlewares/authMiddleware');

const router = express.Router();

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Ingresa un email valido.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Ingresa tu contrasena.')
];

router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', redirectIfAuthenticated, loginValidation, asyncHandler(authController.login));
router.post('/logout', ensureAuthenticated, authController.logout);

module.exports = router;
