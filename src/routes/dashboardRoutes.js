const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(dashboardController.index));

module.exports = router;
