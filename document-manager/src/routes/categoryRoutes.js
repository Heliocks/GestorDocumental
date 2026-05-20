const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const asyncHandler = require('../utils/asyncHandler');
const { validateIdParam } = require('../middlewares/paramMiddleware');

const router = express.Router();

const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('El nombre debe tener entre 2 y 120 caracteres.'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripcion no debe superar 500 caracteres.'),
  body('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('El estado de la categoria no es valido.')
];

router.get('/', asyncHandler(categoryController.index));
router.get('/create', categoryController.showCreate);
router.post('/', categoryValidation, asyncHandler(categoryController.store));
router.get('/:id/edit', validateIdParam('/categories'), asyncHandler(categoryController.edit));
router.put('/:id', validateIdParam('/categories'), categoryValidation, asyncHandler(categoryController.update));
router.patch('/:id/status', validateIdParam('/categories'), asyncHandler(categoryController.toggleStatus));

module.exports = router;
