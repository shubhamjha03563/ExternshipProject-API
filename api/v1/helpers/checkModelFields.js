/*
checks if all fields(array) are present in a model(Model),  
if wrong fields are present in array, sends response and returns false
else returns true
*/

const AppError = require('../utils/AppError');

const checkModelFields = (model, fields, next) => {
  const schemaFields = Object.keys(model.schema.tree);
  let message = '',
    wrongFieldNames = [];
  fields.forEach((field) => {
    if (!schemaFields.includes(field)) {
      wrongFieldNames.push(field);
    }
  });

  if (wrongFieldNames.length > 0) {
    message = `Fields don't exist - { ${wrongFieldNames.join(', ')} }.`;
    next(new AppError(message));
    return false;
  }
  return true;
};

module.exports = checkModelFields;
