const express = require('express');
const usercontroller= require('../controller/userController')
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateRegistration, usercontroller.register);
router.post('/login', validateLogin, usercontroller.login);
router.get('/referrals', usercontroller.getReferrals);

module.exports = router;
