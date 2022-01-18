const express = require('express');
const app = express();

const router = express.Router();
const {
  signup,
  updateProfile,
  searchUsers,
  getUser,
  forgotPassword,
  resetPassword,
  emailVerify,
  getFriends,
  blockUser,
  unblockUser,
  followUser,
  unfollowUser,
  uploadProfilePicture,
} = require('../controllers/userControllers');

const {
  unfriend,
  getSuggestions,
  sendRequest,
  rejectRequests,
  getRequests,
  approveRequests,
} = require('../controllers/friendControllers');

const verify = require('../middlewares/verify');

router.route('/signup').post(signup);
router.route('/').get(verify, searchUsers).put(verify, updateProfile);
router.route('/forgot_password').post(forgotPassword);
router.route('/reset_password').post(resetPassword);
router.route('/email_verify/:email_token').get(emailVerify);
router.route('/:id').get(getUser);
router.route('/block/:id').get(verify, blockUser);
router.route('/unblock/:id').get(verify, unblockUser);
router.route('/follow/:id').get(verify, followUser);
router.route('/unfollow/:id').get(verify, unfollowUser);
router.route('/:id/friends').get(getFriends);

// /friends
router.route('/friends/:id').delete(verify, unfriend);
router.route('/friends/suggestions').get(verify, getSuggestions);
router.route('/friends/requests/send/:id').get(verify, sendRequest);
router.route('/friends/requests/approve/:id').get(verify, approveRequests);
router.route('/friends/requests/:id').delete(verify, rejectRequests);
router.route('/friends/requests').get(verify, getRequests);

module.exports = router;
