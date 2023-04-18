const { StatusCodes } = require('http-status-codes');
const { ApiError } = require('../utils/errors');

module.exports = (req, res, next) => {
  if (req.session.isAuth === true) return next();
  return next();
  // return next(new ApiError('يرجى تسجيل الدخول اولاً', StatusCodes.StatusCodes));
};
