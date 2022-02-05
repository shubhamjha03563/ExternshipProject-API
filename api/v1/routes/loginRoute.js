const router = require('express').Router();

const { login } = require('../controllers/loginController');

router.route('/').post(login);

module.exports = router;
