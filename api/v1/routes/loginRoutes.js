const router = require('express').Router();

const { login } = require('../controllers/loginControllers');

router.route('/').post(login);

module.exports = router;
