const jwt = require('jsonwebtoken');
const checkFields = require('../helpers/checkFields');
const AppError = require('../utils/AppError');

const verify = (req, res, next) => {
  // checks if 'authorization' header present or not and sends response
  checkFields(req.headers, 'headers', ['authorization'], next);

  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return next(new AppError('Not authorized for this route.', 401));
  }

  // console.log(req.headers.cookie.split('=')[1]);
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.log(err);
    return next(new AppError('Not authorized for this route.', 401));
  }
};

module.exports = verify;
