const { Router } = require('express');
const { login, logout } = require('./auth.controllers');

const router = Router();

router.post('/login', login);

router.post('/logout', logout);

module.exports = router;
