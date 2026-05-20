const { validationResult } = require('express-validator');

function getValidationErrors(req) {
  return validationResult(req).array().map((error) => error.msg);
}

function hasValidationErrors(req) {
  return !validationResult(req).isEmpty();
}

module.exports = {
  getValidationErrors,
  hasValidationErrors
};
