// takes error object and returns error message in response

const { deleteFile } = require('../helpers/cloudUpload');

const errorHandler = async (err, req, res, next) => {
  let error = { ...err };
  error.statusCode = 400 || err.status;

  // Cast errors signify that the input was in the wrong format
  if (err.name === 'CastError') {
    error.status = 400;
    error.message = `Invalid value provided for '${err.path}'.`;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = Object.values(err.errors)
      .map((obj) => obj.message)
      .join(', ');
  }

  // Duplicate field errors. These errors don’t have a unique name, so they are accessed with the error code
  if (err.code === 11000) {
    error.status = 400;
    error.message = `The entered value entered for '${
      Object.getOwnPropertyNames(err.keyValue)[0]
    }' is not available. Please enter a different value.`;
  }

  if (req.file) {
    try {
      await deleteFile(req.file.driveFileId);
    } catch (driveError) {
      console.log(driveError);
      console.log(driveError.message);
    }
  }

  console.log(err);
  res.status(error.statusCode).json({
    success: false,
    message: error.message || err.message,
    data: null,
  });

  next();
};

module.exports = errorHandler;
