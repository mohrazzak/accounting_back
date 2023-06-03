const { StatusCodes } = require('http-status-codes');
const { ApiError } = require('../utils/errors');

module.exports = (req, res, next) => {
  console.log(req.session);
  // if (req.session.isAuth) return next();

  // temp
  return next();
  // return next(
  //   new ApiError('يرجى تسجيل الدخول اولاً', StatusCodes.UNAUTHORIZED)
  // );
};
