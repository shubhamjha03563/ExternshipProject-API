const asyncHandler = require('../middlewares/asyncHandler');
const checkFields = require('../helpers/checkFields');
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.unfriend = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: { friends: req.params.id },
    },
    { new: true }
  ).select('friends');

  await User.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { friends: req.user.id },
    },
    { new: true }
  );

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}`));
  }

  res.status(200).json({
    success: true,
    message: 'User removed from friends.',
    data: { user },
  });
});

exports.getSuggestions = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id).select('city');
  let suggestions = await User.find({
    city: user.city,
    _id: { $ne: req.user.id },
  })
    .select('_id username')
    .limit(req.query.lt || 10);

  res.json({
    success: true,
    message: 'Friend suggestions.',
    data: { suggestions },
  });
});

exports.sendRequest = asyncHandler(async (req, res, next) => {
  let user = await User.findByIdAndUpdate(
    req.params.id,
    {
      $push: { friendRequests: req.user.id },
    },
    { new: true }
  );

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}`));
  }

  user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $push: { friendRequestsSent: req.params.id },
    },
    { new: true }
  ).select('friendRequestsSent');

  res.status(200).json({
    success: true,
    message: 'Request sent.',
    data: user,
  });
});

exports.approveRequests = asyncHandler(async (req, res, next) => {
  let user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: { friendRequests: req.params.id },
      $push: { friends: req.params.id },
    },
    { new: true }
  ).select('friends friendRequests');

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}.`));
  }

  await User.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { friendRequestsSent: req.user.id },
      $push: { friends: req.user.id },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Request accepted.',
    data: user,
  });
});

exports.getRequests = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user.id).select('friendRequests');

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}.`));
  }

  res.status(200).json({
    success: true,
    message: 'Request successfull.',
    data: user,
  });
});

exports.rejectRequests = asyncHandler(async (req, res, next) => {
  let user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: { friendRequests: req.params.id },
    },
    { new: true }
  ).select('friendRequests');

  await User.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { friendRequestsSent: req.user.id },
    },
    { new: true }
  );

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}.`));
  }

  res.status(200).json({
    success: true,
    message: 'Friend request rejected.',
    data: user,
  });
});
