const transporter = require('../config/mailer.conf');

const sendEmail = async ({ to, subject, html }) => {
  // Check if required email parameters are missing
  if (!to || !subject || !html) {
    console.error('Missing required email parameters'); // Log an error if parameters are missing
    return; // Exit the function early
  }

  try {
    // Attempt to send an email using the transporter configuration
    const info = await transporter.sendMail({
      from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Set the sender's email address
      to, // Set the recipient's email address
      subject, // Set the email subject
      html, // Set the email content in HTML format
    });

    console.log(`Email sent to ${to}:`, info.messageId); // Log the success message with the recipient and message ID
  } catch (e) {
    console.error('Error sending email:', e.message); // Log an error if sending the email fails
  }
};

module.exports = { sendEmail };
