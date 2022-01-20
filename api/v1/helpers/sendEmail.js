const axios = require('axios');

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

async function sendEmail(to, subject, email_body) {
  let emailResponse = await axios.post('http://localhost:3000/email/send', {
    to,
    from: process.env.NO_REPLY_EMAIL,
    fromName: process.env.COMPANY_NAME,
    email_password: process.env.NO_REPLY_EMAILPASSWORD,
    subject,
    email_body,
  });
  emailResponse = emailResponse.data;
  return emailResponse;
}

module.exports = sendEmail;
