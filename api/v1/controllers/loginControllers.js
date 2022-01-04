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
  let user = await User.findOne({ email }).select('+hash');

  // if user not found or password is wrong
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Wrong login credentials.'));
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
