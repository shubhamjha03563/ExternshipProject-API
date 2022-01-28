const asyncHandler = require('../middlewares/asyncHandler');
const checkModelFields = require('../helpers/checkModelFields');
const Post = require('../models/Post');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { uploadFile, deleteFile } = require('../helpers/cloudUpload');
const fs = require('fs');
const checkPaginationParams = require('../helpers/checkPaginationParams');
const Comment = require('../models/Comment');

exports.getFeed = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id);

  let paramsObject = checkPaginationParams(req.query);
  if (!paramsObject.success) {
    console.log(paramsObject.message);
    return next(new AppError(searchResultObject.message, 404));
  }

  let posts = await Post.find({
    $and: [
      {
        // get friends and followed people posts
        userId: { $in: user.friends.concat(user.following) },
      },
      // except those who blocked the current user
      { userId: { $nin: user.blockedBy.concat([req.user.id]) } },
      { createdAt: { $gte: user.lastLoggedIn } },
    ],
  })
    .skip(parseInt(paramsObject.pageLimit) * (parseInt(paramsObject.page) - 1))
    .limit(parseInt(paramsObject.pageLimit))
    .sort('-createdAt');

  // if posts are less, get more posts related to liked posts, tagged users posts...etc
  if (posts.length < paramsObject.pageLimit) {
    let morePosts = await Post.find({
      // posts similar to liked-tags and post-tags
      tags: { $in: user.likedTags.concat(user.postTags) },
      // posts from tagged users, and not from blocked-by users
      $and: [
        { userId: { $in: user.usersTagged } },
        { userId: { $nin: user.blockedBy.concat([req.user.id]) } },
      ],
    })
      // get remaining number of posts to complete the page limit
      .limit(parseInt(paramsObject.pageLimit) - posts.length)
      .sort('-updatedAt');

    posts.push(morePosts);
  }

  res.status(200).json({
    success: true,
    message: 'New feeds fetched.',
    data: { posts },
  });
});

exports.getPost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError(`Post not found with id - ${req.params.id}`, 400));
  }

  res.status(200).json({
    success: true,
    message: 'Post fetched successfully.',
    data: { post },
  });
  return next();
});

exports.createPost = asyncHandler(async (req, res, next) => {
  req.body.userId = req.user.id;
  if (req.file) {
    // get publicUrl and fileId
    const fileInfo = await uploadFile(
      req.file.filename,
      req.file.mimetype,
      req.file.path
    );
    req.body.imageUrl = {
      fileId: fileInfo.fileId,
      publicUrl: fileInfo.publicUrl,
    };

    // remove pic from local storage after it's uploaded to cloud
    fs.unlink(req.file.path, () => {});

    // If failed to upload, then return error and don't create account
    if (fileInfo.publicUrl == '') {
      return next(new AppError('Picture not uploaded. Please try again!', 400));
    }
  }
  let post = await Post.create(req.body);

  res.status(200).json({
    success: true,
    message: 'Post created successfully.',
    json: { post },
  });

  // collect data (user tags, post tags)
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { usersTagged: post.userTags, postTags: post.tags },
  });

  return next();
});

exports.updatePost = asyncHandler(async (req, res, next) => {
  let bodyFieldsArray = Object.keys(req.body);
  if (bodyFieldsArray.length === 0 && !req.file) {
    return next(
      new AppError('Please provide any {field: value} pair to be updated.')
    );
  }

  // checks if the field names provided in body are present in the model or not
  if (!checkModelFields(Post, bodyFieldsArray, next)) {
    return;
  }

  if (req.file) {
    // get old fileId and delete it from cloud storage
    let post = await Post.findById(req.params.id).select('imageUrl');
    if (!post) {
      return next(new AppError(`No post found with the id ${req.params.id}.`));
    }

    await deleteFile(post.imageUrl.fileId);

    // get publicUrl and fileId
    const fileInfo = await uploadFile(
      req.file.filename,
      req.file.mimetype,
      req.file.path
    );
    req.body.imageUrl = {
      fileId: fileInfo.fileId,
      publicUrl: fileInfo.publicUrl,
    };

    // remove pic from local storage after it's uploaded to cloud
    fs.unlink(req.file.path, () => {});

    // If failed to upload, then return error and don't update
    if (fileInfo.publicUrl == '') {
      return next(new AppError('Update failed. Please try again!', 400));
    }

    // if any error happens, then this can be used to remove the file from drive in future
    req.file.driveFileId = fileInfo.fileId;
  }

  let post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!post) {
    return next(new AppError(`No post found with the id ${req.params.id}.`));
  }

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: { post },
  });
});

exports.deletePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findByIdAndDelete(req.params.id);
  if (!post) {
    return next(new AppError(`Post not found with id - ${req.params.id}`, 400));
  }

  if (post.imageUrl.hasOwnProperty('fileId')) {
    await deleteFile(post.imageUrl.fileId);
  }

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully.',
    data: null,
  });
});

exports.saveUnsavePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError(`Post not found with id - ${req.params.id}`, 400));
  }

  let user = await User.findById(req.user.id);
  let message = '';
  if (user.savedPosts.includes(req.params.id)) {
    user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: { savedPosts: req.params.id },
      },
      { new: true }
    ).select('savedPosts');
    message = 'Post unsaved.';
  } else {
    user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: { savedPosts: req.params.id },
      },
      { new: true }
    ).select('savedPosts');
    message = 'Post saved.';
  }

  res.status(200).json({
    success: true,
    message,
    json: { user },
  });
});

exports.likeUnlikePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) {
    return next(new AppError(`Post not found with id - ${req.params.id}`, 400));
  }

  let user = await User.findById(req.user.id);
  let message = '';
  if (user.likedPosts.includes(req.params.id)) {
    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: -1 } },
      { new: true }
    );
    user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: { likedPosts: req.params.id },
      },
      { new: true }
    ).select('likedPosts');

    message = 'Post unliked.';
  } else {
    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: { likedPosts: req.params.id },
        $addToSet: { likedTags: post.tags },
      },
      { new: true }
    ).select('likedPosts');
    message = 'Post liked.';
  }

  res.status(200).json({
    success: true,
    message,
    json: { user },
  });
});

exports.getComments = asyncHandler(async (req, res, next) => {
  let paramsObject = checkPaginationParams(req.query);
  if (!paramsObject.success) {
    console.log(searchResultObject.message);
    return next(new AppError(searchResultObject.message, 404));
  }

  let post = await Post.findById(req.params.id).select('id');
  if (!post) {
    return next(new AppError(`No post found with id - ${req.params.id}`, 400));
  }

  let comments = await Comment.find({
    $and: [{ postId: req.params.id }, { commentType: 'new' }],
  })
    .skip(parseInt(paramsObject.pageLimit) * (parseInt(paramsObject.page) - 1))
    .limit(parseInt(paramsObject.pageLimit));

  res.status(200).json({
    success: true,
    message: `${comments.length} Comments fetched.`,
    data: { comments },
  });
});

exports.getReplies = asyncHandler(async (req, res, next) => {
  let paramsObject = checkPaginationParams(req.query);
  if (!paramsObject.success) {
    console.log(paramsObject.message);
    return next(new AppError(searchResultObject.message, 404));
  }

  let comment = await Comment.findById(req.params.id).select('replies');
  if (!comment) {
    return next(
      new AppError(`No comment found with id - ${req.params.id}`, 400)
    );
  }

  let replies = await Comment.find({
    $and: [{ _id: { $in: comment.replies } }, { commentType: 'reply' }],
  })
    .skip(parseInt(paramsObject.pageLimit) * (parseInt(paramsObject.page) - 1))
    .limit(parseInt(paramsObject.pageLimit));

  res.status(200).json({
    success: true,
    message: `${replies.length} replies fetched.`,
    data: { replies },
  });
});
