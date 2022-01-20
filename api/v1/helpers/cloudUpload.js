const drive = require('../../../config/google');
const path = require('path');
const fs = require('fs');

async function generatePublicUrl(fileId) {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const result = await drive.files.get({
      fileId,
      fields: 'webViewLink',
    });
    return result.data.webViewLink;
  } catch (err) {
    console.log(err);
    console.log(err.message);
    return '';
  }
}

exports.uploadFile = async (newName, mimeType, filePath) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: newName,
        mimeType,
      },
      media: {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
      },
    });

    const publicUrl = await generatePublicUrl(response.data.id);
    return { fileId: response.data.id, publicUrl };
  } catch (err) {
    console.log(err);
    console.log(err.message);
    return '';
  }
};

exports.deleteFile = async (fileId) => {
  try {
    await drive.files.delete({
      fileId,
    });
    return true;
  } catch (err) {
    console.log(err);
    console.log(err.message);
    return false;
  }
};
