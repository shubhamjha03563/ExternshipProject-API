const router = require('express').Router();
const {
  signup,
  updateProfile,
  searchUsers,
  getUser,
  forgotPassword,
  resetPassword,
  emailVerify,
} = require('../controllers/userControllers');
const verify = require('../middlewares/verify');

router.route('/signup').post(signup);
router.route('/').get(verify, searchUsers);
router.route('/forgot_password').post(forgotPassword);
router.route('/reset_password').post(resetPassword);
router.route('/email_verify/:email_token').get(emailVerify);
router.route('/:id').get(getUser).put(verify, updateProfile);

module.exports = router;
