const multer = require('multer');
const AppError = require('../utils/AppError');

const userStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, 'user' + Date.now() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image')) {
    cb(new AppError('Invalid file format!', 422), false);
    /*
    The 422 (Unprocessable Entity) status code means the server
    understands the content type of the request entity (hence a
    415 (Unsupported Media Type) status code is inappropriate),
    and the syntax of the request entity is correct (thus a 400
    (Bad Request) status code is inappropriate)
    */
  } else {
    cb(null, true);
  }
};

const uploadUserImage = multer({
  storage: userStorage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2 MB in bytes
  },
});

exports.uploadUserImage = uploadUserImage.single('image');

/*
FILE INFORMATION
{
  fieldname: 'imageFile',
  originalname: 'bootcamp.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'uploads/',
  filename: '704959564fa1c60a3c0a8e9bc98170b2',
  path: 'uploads\\704959564fa1c60a3c0a8e9bc98170b2',
  size: 94970
}
*/
