const transporter = require('../config/mailer.conf');

const sendEmail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    console.error('Missing required email parameters');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}:`, info.messageId);
  } catch (e) {
    console.error('Error sending email:', e.message);
  }
};

module.exports = { sendEmail };
