const express = require('express');

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
} = require('../controllers/userControllers');

const {
  unfriend,
  getSuggestions,
  sendRequest,
  rejectRequests,
  getRequests,
  approveRequests,
} = require('../controllers/friendControllers');

const verifyUser = require('../middlewares/verifyUser');

router.route('/signup').post(signup);
router.route('/').get(verifyUser, searchUsers).put(verifyUser, updateProfile);
router.route('/forgot_password').post(forgotPassword);
router.route('/reset_password').post(resetPassword);
router.route('/email_verify/:email_token').get(emailVerify);
router.route('/:id').get(getUser);
router.route('/block/:id').get(verifyUser, blockUser);
router.route('/unblock/:id').get(verifyUser, unblockUser);
router.route('/follow/:id').get(verifyUser, followUser);
router.route('/unfollow/:id').get(verifyUser, unfollowUser);
router.route('/:id/friends').get(getFriends);

// /friends
router.route('/friends/:id').delete(verifyUser, unfriend);
router.route('/friends/suggestions').get(verifyUser, getSuggestions);
router.route('/friends/requests/send/:id').get(verifyUser, sendRequest);
router.route('/friends/requests/approve/:id').get(verifyUser, approveRequests);
router.route('/friends/requests/:id').delete(verifyUser, rejectRequests);
router.route('/friends/requests').get(verifyUser, getRequests);

module.exports = router;
