const { Router } = require('express');
const { getMonthly } = require('./monthly.controllers');
const { isAuth } = require('../../middlewares');

const router = Router();

router.get('/', isAuth, getMonthly);

module.exports = router;
