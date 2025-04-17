const nodemailer = require('nodemailer');

// Create a transporter object using nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // SMTP server host from environment variables
  port: process.env.EMAIL_PORT, // SMTP server port from environment variables
  secure: process.env.EMAIL_SECURE, // Use secure connection (true for 465, false for other ports)
  auth: {
    user: process.env.EMAIL_USER, // SMTP authentication username from environment variables
    pass: process.env.EMAIL_PASS, // SMTP authentication password from environment variables
  },
});

module.exports = transporter;
