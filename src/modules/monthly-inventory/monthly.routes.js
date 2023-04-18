const { Router } = require('express');
const { getMonthly } = require('./monthly.controllers');

const router = Router();

router.get('/', getMonthly);


module.exports = router;
