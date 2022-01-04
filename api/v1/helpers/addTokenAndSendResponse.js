/* 
adds token to cookie and sends response json provided
*/

const addTokenAndSendResponse = async (res, user, jsonResponse, statusCode) => {
  const token = user.getJwtToken(process.env.JWT_EXPIRE);
  const options = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRE),
    httpOnly: true,
  };

  let defaultResponseJson = {
    success: true,
    message: 'Success',
    data: null,
  };

  // if no jsonResponse provided
  jsonResponse = jsonResponse == undefined ? defaultResponseJson : jsonResponse;

  res.cookie('token', token, options).status(statusCode).json(jsonResponse);
};

module.exports = addTokenAndSendResponse;
