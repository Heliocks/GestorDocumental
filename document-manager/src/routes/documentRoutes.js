const express = require('express');
const { body } = require('express-validator');
const documentController = require('../controllers/documentController');
const asyncHandler = require('../utils/asyncHandler');
const { upload } = require('../middlewares/uploadMiddleware');
const { csrfProtection } = require('../middlewares/csrfMiddleware');
const { validateIdParam } = require('../middlewares/paramMiddleware');
const { requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

const documentStatuses = [
  'Vigente',
  'Revisión',
  'Creación',
  'Desactualizado',
  'Obsoleto'
];
const documentFormStatuses = documentStatuses.filter((status) => status !== 'Vigente');

const documentValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 160 })
    .withMessage('El titulo debe tener entre 3 y 160 caracteres.'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripcion no debe superar 1000 caracteres.'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Selecciona una categoria valida.'),
  body('department_id')
    .isInt({ min: 1 })
    .withMessage('Selecciona un departamento valido.'),
  body('company_id')
    .isInt({ min: 1 })
    .withMessage('Selecciona una empresa valida.'),
  body('owner_user_id')
    .isInt({ min: 1 })
    .withMessage('Selecciona un dueño valido.'),
  body('document_date')
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('Selecciona una fecha de alta valida.'),
  body('document_status')
    .isIn(documentFormStatuses)
    .withMessage('El estado Vigente solo se asigna al aprobar el documento.'),
  body('visible_user_ids')
    .optional({ values: 'falsy' })
    .custom((value) => /^[1-9]\d*(,[1-9]\d*)*$/.test(String(value)))
    .withMessage('Selecciona usuarios validos para mostrar el documento.')
];

router.get('/', asyncHandler(documentController.index));
router.get('/create', requireRole('admin'), asyncHandler(documentController.showCreate));
router.post('/', requireRole('admin'), upload.single('document'), csrfProtection(), documentValidation, asyncHandler(documentController.store));
router.get('/:id/edit', requireRole('admin'), validateIdParam('/documents'), asyncHandler(documentController.edit));
router.put('/:id', requireRole('admin'), validateIdParam('/documents'), upload.single('document'), csrfProtection(), documentValidation, asyncHandler(documentController.update));
router.get('/:id', validateIdParam('/documents'), asyncHandler(documentController.detail));
router.get('/:id/download', validateIdParam('/documents'), asyncHandler(documentController.download));
router.delete('/:id', requireRole('admin'), validateIdParam('/documents'), asyncHandler(documentController.destroy));

module.exports = router;
