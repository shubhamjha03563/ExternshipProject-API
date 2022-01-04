// checks if all fields(array) are present in the object(object) and returns wrong fields in message(string)

/*
checks if all fields(array) are present in the object,  
if fields are not present in object, sends response and returns false 
else returns true
*/

const AppError = require('../utils/AppError');

const checkFields = (object, objectName, fieldsToCheck, next) => {
  let message = '',
    reqFields = [];
  fieldsToCheck.forEach((field) => {
    if (!object.hasOwnProperty(field) || object[field] == '') {
      reqFields.push(field);
    }
  });

  if (reqFields.length > 0) {
    message = `Please provide { ${reqFields.join(
      ', '
    )} } in the ${objectName}.`;

    next(new AppError(message, 403));
    return false;
  }

  return true;
};

module.exports = checkFields;
