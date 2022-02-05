const asyncHandler = require('../middlewares/asyncHandler');
const checkFields = require('../helpers/checkFields');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const addTokenAndSendResponse = require('../helpers/addTokenAndSendResponse');

exports.login = asyncHandler(async (req, res, next) => {
  // checks if required fields are present in the body json
  if (!checkFields(req.body, 'body json', ['email', 'password'], next)) {
    return;
  }

  let { email, password } = req.body;

  // returns null if not found
  let user = await User.findOneAndUpdate(
    { email },
    { lastLoggedIn: Date.now() }
  ).select('+hash');

  if (!user) {
    // if no user found with the email
    return next(new AppError('Account not found.', 404));
  } else if (!user.emailVerified) {
    // if email not verified
    return next(new AppError('Please verify your email to login.', 400));
  } else if (!(await user.matchPassword(password))) {
    // if password is wrong
    return next(new AppError('Wrong login credentials.', 401));
  }

  // password should not be given in response, so remove it from user object
  user.hash = undefined;
  user.password = undefined;

  let jsonResponse = {
    success: true,
    message: 'Login successfull.',
    data: { user },
  };

  // adds jwt token to cookie and sends response
  addTokenAndSendResponse(res, user, jsonResponse, 200);

  next();
});
