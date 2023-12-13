/* eslint-disable import/no-extraneous-dependencies */
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //steps to send emails with Nodemailer..
  //1.Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    //secure: false,
    //logger: true,
    auth: {
      user: 'mdismail1503@gmail.com',
      pass: 'gyrjrlfzfeonhrkt',
    },
  });
  //2.Define the email options

  const mailOptions = {
    from: 'Ismail Ansari <mdismail1503@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  //3.Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
