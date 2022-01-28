const asyncHandler = require('../middlewares/asyncHandler');
const checkFields = require('../helpers/checkFields');
const Comment = require('../models/Comment');
const AppError = require('../utils/AppError');
const Post = require('../models/Post');

exports.createComment = asyncHandler(async (req, res, next) => {
  if (!checkFields(req.body, 'body json', ['text'], next)) {
    return;
  }
  let post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError(`No post found with id - ${req.params.id}.`));
  }

  req.body.userId = req.user.id;
  req.body.postId = req.params.id;
  req.body.commentType = 'new';
  let comment = await Comment.create(req.body);
  post = await Post.findByIdAndUpdate(req.params.id, {
    $push: { comments: comment.id },
  });

  res.status(200).json({
    success: true,
    message: 'Comment created successfully.',
    data: { comment },
  });
  next();
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  let comment = await Comment.findOneAndDelete({
    $and: [{ _id: req.params.id }, { userId: req.user.id }],
  });
  if (!comment) {
    return next(
      new AppError(
        `No comment found with the id - ${req.params.id} OR the current user is not the owner of this comment.`,
        400
      )
    );
  }

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully.',
    data: null,
  });
  next();
});

exports.updateComment = asyncHandler(async (req, res, next) => {
  if (!checkFields(req.body, 'body json', ['text'], next)) {
    return;
  }
  let comment = await Comment.findOneAndUpdate(
    { $and: [{ _id: req.params.id }, { userId: req.user.id }] },
    req.body,
    { new: true }
  );
  if (!comment) {
    return next(
      new AppError(
        `No comment found with the id - ${req.params.id} OR the current user is not the owner of this comment.`,
        400
      )
    );
  }

  res.status(200).json({
    success: true,
    message: 'Comment updated successfully.',
    data: comment,
  });
  next();
});

exports.replyToComment = asyncHandler(async (req, res, next) => {
  if (!checkFields(req.body, 'body json', ['text'], next)) {
    return;
  }
  let comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(
      new AppError(`No comment found with the id - ${req.params.id}`, 400)
    );
  }

  req.body.userId = req.user.id;
  req.body.postId = req.params.id;
  req.body.commentType = 'reply';
  let reply = await Comment.create(req.body);

  comment = await Comment.findByIdAndUpdate(req.params.id, {
    $push: { replies: reply.id },
  });

  if (comment.commentType === 'reply') {
    comment = await Comment.findOneAndUpdate(
      { replies: req.params.id },
      { $push: { replies: reply.id } }
    );
  }

  res.status(200).json({
    success: true,
    message: 'Replied successfully.',
    data: { reply },
  });
  next();
});
