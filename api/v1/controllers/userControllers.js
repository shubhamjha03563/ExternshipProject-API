const asyncHandler = require('../middlewares/asyncHandler');
const checkFields = require('../helpers/checkFields');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const search = require('../helpers/search');
const checkModelFields = require('../helpers/checkModelFields');
const addTokenAndSendResponse = require('../helpers/addTokenAndSendResponse');
const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');

exports.getUser = asyncHandler(async (req, res, next) => {
  let userId = req.params.id;

  let user = await User.findById(userId);
  if (!user) {
    return next(new AppError(`User not found with the id - ${userId}`));
  }

  res.json({ success: true, message: 'success', data: { user } });

  next();
});

exports.signup = asyncHandler(async (req, res, next) => {
  // checks if required fields are present in the body or not

  let { email, password } = req.body;

  let user = await User.findOne({ email, emailVerified: true });

  // if user already registered
  if (user) {
    return next(
      new AppError(
        'User already registered, please login with your credentials'
      )
    );
  }

  req.body.hash = password;
  if (req.file) {
    req.body.profilePic = req.file.path;
  }

  user = await User.create(req.body);

  /*
  {
    to: receiver_email,
    from: sender_email,
    fromName: sender_name,
    email_password: sender_email_password,
    subject: email_subject,
    email_body: email_body
  }
  */

  // contains id of new user
  const emailVerifyToken = user.getJwtToken(process.env.EMAIL_JWT_EXPIRE);
  const emailVerifyUrl = `${process.env.EMAIL_VERIFY_URL}/${emailVerifyToken}`;

  await User.findByIdAndUpdate(user.id, { emailToken: emailVerifyToken });

  let emailResponse = await axios.post('http://localhost:3000/email/send', {
    to: user.email,
    from: process.env.NO_REPLY_EMAIL,
    fromName: process.env.COMPANY_NAME,
    email_password: process.env.NO_REPLY_EMAILPASSWORD,
    subject: 'Email verify link',
    email_body: `Click this link to verify your email - ${emailVerifyUrl}`,
  });
  emailResponse = emailResponse.data;

  if (!emailResponse.success) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return next(
      new AppError(`${emailResponse.message}`, emailResponse.statusCode)
    );
  }

  // password should'nt be given as response, so delete it from user object
  user.hash = undefined;
  res.json({
    success: true,
    message: `A link to verify the email has been sent to your email.`,
    data: null,
  });

  next();
});

exports.emailVerify = asyncHandler(async (req, res, next) => {
  try {
    const decodedToken = jwt.verify(
      req.params.email_token,
      process.env.JWT_SECRET
    );
    // decodedToken format -
    // { id: '61d481e6a83782eddww4677c', iat: 1612346839, exp: 1612343229 }

    // email verified
    let user = await User.findByIdAndUpdate(
      decodedToken.id,
      { emailVerified: true, emailToken: '' },
      { new: true }
    );

    if (!user) {
      return next(new AppError(`Link error. Please try after some time.`, 400));
    }

    // sign up complete
    let jsonResponse = {
      success: true,
      message: 'User registered successfully!',
      data: { user },
    };

    addTokenAndSendResponse(res, user, jsonResponse, 200);
  } catch (err) {
    console.log(err);
    if (err.name == 'TokenExpiredError') {
      let user = await User.findOne({ emailToken: req.params.email_token });
      if (!user) {
        return next(new AppError(`Invalid link`, 400));
      }

      const emailVerifyToken = user.getJwtToken(process.env.EMAIL_JWT_EXPIRE);
      const emailVerifyUrl = `${process.env.EMAIL_VERIFY_URL}/${emailVerifyToken}`;

      let emailResponse = await axios.post('http://localhost:3000/email/send', {
        to: user.email,
        from: process.env.NO_REPLY_EMAIL,
        fromName: process.env.COMPANY_NAME,
        email_password: process.env.NO_REPLY_EMAILPASSWORD,
        subject: 'Email verify link',
        email_body: `Click this link to verify your email - ${emailVerifyUrl}`,
      });
      emailResponse = emailResponse.data;

      if (!emailResponse.success) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        return next(
          new AppError(`${emailResponse.message}`, emailResponse.statusCode)
        );
      }

      await User.findByIdAndUpdate(user.id, { emailToken: emailVerifyToken });

      return next(
        new AppError(
          'This link has expired. A new link has been sent to your email to verify your email id.',
          200
        )
      );
    }

    return next(new AppError('Not authorized for this route.', 401));
  }
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  let userId = req.user.id;

  if (req.body.hasOwnProperty('password')) {
    delete req.body.password;
    return next(new AppError('Password change not available.'));
  }

  let bodyFieldsArray = Object.keys(req.body);
  if (bodyFieldsArray.length === 0 && !req.file) {
    return next(
      new AppError('Please provide any {field: value} pair to be updated.')
    );
  }

  // checks if the field names provided in body are present in the model or not
  if (!checkModelFields(User, bodyFieldsArray, next)) {
    return;
  }

  // console.log('../../' + req.file.path);
  if (req.file) {
    fs.unlink(req.file.path, () => {});
    req.body.profilePic = req.file.path;
  }

  let user = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
  });

  if (!user) {
    return next(new AppError(`No user found with the id ${userId}.`));
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  if (!checkFields(req.body, 'body json', ['email'], next)) {
    return;
  }

  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(`No user found with email ${req.body.email}`));
  }

  const resetToken = user.getResetPasswordToken();

  // save reset token to db
  await user.save();

  //Create reset url
  const resetUrl = `${process.env.RESET_PASSWORD_URL}/${resetToken}`;

  /*
  {
    to: receiver_email,
    from: sender_email,
    fromName: sender_name,
    email_password: sender_email_password,
    subject: email_subject,
    email_body: email_body
  }
  */
  let emailResponse = await axios.post('http://localhost:3000/email/send', {
    to: user.email,
    from: process.env.NO_REPLY_EMAIL,
    fromName: process.env.COMPANY_NAME,
    email_password: process.env.NO_REPLY_EMAILPASSWORD,
    subject: 'Password reset link',
    email_body: `You are receiving this email because you (or someone else) has requested the reset of password for your account on AAKANKSHA HEALTHCARE SERVICES. Please click this link for password reset, it's valid for 10 minutes - ${resetUrl}`,
  });
  emailResponse = emailResponse.data;

  if (!emailResponse.success) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return next(
      new AppError(`${emailResponse.message}`, emailResponse.statusCode)
    );
  }

  res.json({
    success: true,
    message: `A link to reset the password has been sent to your email.`,
    data: null,
  });

  next();
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  if (!checkFields(req.body, 'body json', ['token', 'newPassword'], next)) {
    return;
  }

  let { newPassword, token } = req.body;

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Link has expired.'));
  }

  user.hash = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfull',
    data: null,
  });

  next();
});

exports.searchUsers = asyncHandler(async (req, res, next) => {
  let searchResultObject = await search(User, req.query);
  if (!searchResultObject.success) {
    console.log(searchResultObject.message);
    return next(new AppError(searchResultObject.message, 404));
  }

  res.json({
    success: true,
    message: 'Search successfull.',
    data: { searchResults: searchResultObject },
  });
  next();
});

exports.getFriends = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('username friends');
  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}`));
  }

  res.status(200).json({
    success: true,
    message: 'Request successfull',
    data: user,
  });
});

exports.blockUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $push: { blocked: req.params.id },
    },
    { new: true }
  ).select('blocked');

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}`));
  }

  res.status(200).json({
    success: true,
    message: 'User blocked',
    data: user,
  });
});

exports.unblockUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: { blocked: req.params.id },
    },
    { new: true }
  ).select('blocked');

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}`));
  }

  res.status(200).json({
    success: true,
    message: 'User unblocked',
    data: user,
  });
});

exports.followUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $push: { following: req.params.id },
    },
    { new: true }
  ).select('following');

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}`));
  }

  await User.findByIdAndUpdate(
    req.params.id,
    {
      $push: { followers: req.user.id },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'User followed',
    data: user,
  });
});

exports.unfollowUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: { following: req.params.id },
    },
    { new: true }
  ).select('following');

  if (!user) {
    return next(new AppError(`No user found with id - ${req.params.id}`));
  }

  await User.findByIdAndUpdate(
    req.params.id,
    {
      $pull: { followers: req.user.id },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'User unfollowed',
    data: user,
  });
});
