const express = require('express');
const approvalController = require('../controllers/approvalController');
const { validateIdParam } = require('../middlewares/paramMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(approvalController.index));
router.patch('/:id/approve', validateIdParam('/approvals'), asyncHandler(approvalController.approve));
router.patch('/:id/reject', validateIdParam('/approvals'), asyncHandler(approvalController.reject));

module.exports = router;
