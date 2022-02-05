const express = require('express');

const {
  createPost,
  getPost,
  updatePost,
  deletePost,
  getComments,
  getFeed,
  likeUnlikePost,
  saveUnsavePost,
  getReplies,
} = require('../controllers/postController');

const {
  createComment,
  updateComment,
  deleteComment,
  replyToComment,
} = require('../controllers/commentController');

const verifyUser = require('../middlewares/verifyUser');
const router = express.Router();

// posts
router.route('/feed').get(verifyUser, getFeed);
router.route('/').post(verifyUser, createPost);
router
  .route('/:id')
  .get(getPost)
  .put(verifyUser, updatePost)
  .delete(verifyUser, deletePost);
router.route('/:id/like').get(verifyUser, likeUnlikePost);
router.route('/:id/save').get(verifyUser, saveUnsavePost);

// comments
router.route('/:id/comments').get(getComments).post(verifyUser, createComment);
router
  .route('/comments/:id')
  .put(verifyUser, updateComment)
  .delete(verifyUser, deleteComment);
router
  .route('/comments/:id/reply')
  .post(verifyUser, replyToComment)
  .get(getReplies);

module.exports = router;
