const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const asyncHandler = require('../utils/asyncHandler');
const { validateIdParam } = require('../middlewares/paramMiddleware');

const router = express.Router();

const baseUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('El nombre debe tener entre 2 y 120 caracteres.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Ingresa un email valido.')
    .normalizeEmail(),
  body('role')
    .isIn(['admin', 'user'])
    .withMessage('Selecciona un rol valido.'),
  body('department_id')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Selecciona un departamento valido.'),
  body('company_id')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Selecciona una empresa valida.'),
  body('is_active')
    .isIn(['true', 'false'])
    .withMessage('Selecciona un estado valido.')
];

const createUserValidation = [
  ...baseUserValidation,
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('La contrasena debe tener entre 8 y 72 caracteres.')
];

const updateUserValidation = [
  ...baseUserValidation,
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 8, max: 72 })
    .withMessage('La nueva contrasena debe tener entre 8 y 72 caracteres.')
];

const catalogValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('El nombre del catalogo debe tener entre 2 y 120 caracteres.'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripcion no debe superar 500 caracteres.')
];

router.get('/', asyncHandler(userController.index));
router.get('/create', asyncHandler(userController.showCreate));
router.post('/catalogs/departments', catalogValidation, asyncHandler(userController.storeDepartment));
router.delete('/catalogs/departments/:id', validateIdParam('/users#catalogs'), asyncHandler(userController.destroyDepartment));
router.post('/catalogs/companies', catalogValidation, asyncHandler(userController.storeCompany));
router.delete('/catalogs/companies/:id', validateIdParam('/users#catalogs'), asyncHandler(userController.destroyCompany));
router.post('/', createUserValidation, asyncHandler(userController.store));
router.get('/:id/edit', validateIdParam('/users'), asyncHandler(userController.edit));
router.put('/:id', validateIdParam('/users'), updateUserValidation, asyncHandler(userController.update));
router.patch('/:id/status', validateIdParam('/users'), asyncHandler(userController.toggleStatus));

module.exports = router;
