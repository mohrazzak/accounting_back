const { StatusCodes } = require('http-status-codes');
const { responser } = require('../../utils');
const { ApiError } = require('../../utils/errors');
const {
  constants: { WEBSITE_PASSWORD },
} = require('../../config');

async function login(req, res, next) {
  try {
    const { password } = req.body;
    if (password?.toString() !== WEBSITE_PASSWORD)
      throw new ApiError('كلمةالسر غير صحيحة', StatusCodes.UNAUTHORIZED);
    // req.session.isAuth = true;
    return responser(res, StatusCodes.ACCEPTED);
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    // req.session = null;
    return responser(res, StatusCodes.ACCEPTED);
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, logout };
