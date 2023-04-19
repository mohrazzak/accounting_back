const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const {
  constants: { WEBSITE_PASSWORD },
} = require('../../config');

async function login(req, res, next) {
  try {
    if (req.session.isAuth)
      throw new ApiError('الحساب مسجل الدخول مسبقا', StatusCodes.BAD_REQUEST);
    const { password } = req.body;
    console.log(password);
    if (password?.toString() !== '123')
      throw new ApiError('كلمةالسر غير صحيحة', StatusCodes.UNAUTHORIZED);
    req.session.isAuth = true;
    return responser(res, StatusCodes.ACCEPTED);
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    if (!req.session.isAuth)
      throw new ApiError('يرجى تسجيل الدخول اولاً', StatusCodes.UNAUTHORIZED);
    req.session.destroy();
    return responser(res, StatusCodes.ACCEPTED);
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, logout };
