const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }
    next();
  };
};

module.exports = { validate };
