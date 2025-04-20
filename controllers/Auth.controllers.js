const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../helpers/SendEmail.helper');

const register = async (req, res) => {
  // New session transaction
  const session = await mongoose.startSession(); // Start a new session for transaction
  try {
    session.startTransaction(); // Begin the transaction
    // Extract user information from request body
    const { username, email, password, role } = req.body; // Destructure user details from the request body

    // Check if User is already exist on database
    const checkExistingUser = await User.findOne(
      { $or: [{ username }, { email }] }, // Check if username or email already exists
      null,
      { session } // Use the current session
    );

    if (checkExistingUser) {
      await session.abortTransaction(); // Abort the transaction if user exists
      session.endSession(); // End the session
      return res.status(400).json({
        success: false,
        message:
          'User is alredy exists either with same username or same email. Please try a different username or email', // Error message for existing user
      });
    }

    // Hash user password
    const salt = await bcrypt.genSalt(10); // Generate a salt for hashing
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the generated salt

    // User verification
    const verificationToken = crypto.randomBytes(32).toString('hex'); // Generate a random verification token
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex'); // Hash the token

    // Create new user and save in database
    const newlyCreatedUser = new User({
      username, // Set the username
      email, // Set the email
      password: hashedPassword, // Set the hashed password
      role: role, // Set the role
      verificationToken: hashedToken, // Save the hashed token
      createdAt: new Date(), // Set the creation date
    });

    await newlyCreatedUser.save({ session }); // Save the new user in the database using the session

    // Commit transaction if both operation succeed
    await session.commitTransaction(); // Commit the transaction
    session.endSession(); // End the session

    // Send email AFTER transaction is successful
    const baseUrl = process.env.BASE_URL; // Get the base URL from environment variables
    const verificationUrl = `${baseUrl}/api/auth/verify/${verificationToken}`; // Construct the verification URL
    const html = `<p>Click to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`; // Create the email content

    await sendEmail({
      to: email, // Recipient email
      subject: 'Verify your Email', // Email subject
      html, // Email body
    });

    res.status(200).json({
      success: true, // Indicate success
      message: 'User registered successfully', // Success message
    });
  } catch (e) {
    await session.abortTransaction(); // Abort the transaction in case of error
    session.endSession(); // End the session
    console.error('Error during user registration:', e.message); // Log the error message
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Error message
    });
  } finally {
    session.endSession(); // Ensure session is always ended
  }
};

const verifyEmail = async (req, res) => {
  try {
    // Extract the 'token' parameter from the request URL
    const { token } = req.params; // Get the token from the request parameters

    // Hash the token received from the URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex'); // Hash the token

    // Attempt to find a user in the database whose 'verificationToken' matches the hashed token
    const user = await User.findOne({ verificationToken: hashedToken }); // Search for a user with the matching hashed token

    // If no user is found, it means the token is invalid or expired
    if (!user) {
      return res.status(400).json({
        success: false, // Indicate failure
        message: 'Invalid or expired verification token.', // Error message for invalid token
      });
    }

    // If a user is found, mark the user as verified
    user.verified = true; // Set the verified flag to true

    // Remove the verification token to prevent reuse
    user.verificationToken = undefined; // Clear the verification token

    // Save the updated user object to the database
    await user.save(); // Save the changes to the database

    return res
      .status(200) // Set the HTTP status to 200 (OK)
      .json({ success: true, message: 'Email verified successfully.' }); // Send success response
  } catch (e) {
    console.error('Error during user verification:', e); // Log the error for debugging
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Generic error message
    });
  }
};

const login = async (req, res) => {
  try {
    // Extract user information from request body
    const { email, password } = req.body; // Get email and password from the request body

    // Find if current user exists in database or not
    const user = await User.findOne({
      email, // Search for a user with the provided email
    });
    if (!user) {
      return res.status(404).json({
        success: false, // Indicate failure
        message: 'User doesn`t exists!', // Error message for non-existent user
      });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({
        success: false, // Indicate failure
        message: 'Please verify your email before logging in.', // Error message for unverified user
      });
    }

    // Check if password matches
    const isPasswordMatch = await bcrypt.compare(password, user.password); // Compare provided password with stored hashed password
    if (!isPasswordMatch) {
      return res.status(404).json({
        success: false, // Indicate failure
        message: 'Invalid credentials!', // Error message for invalid credentials
      });
    }

    // Create JWT token
    const accessToken = jwt.sign(
      {
        _id: user._id, // Include user ID in the token payload
        email: user.email, // Include user email in the token payload
        role: user.role, // Include user role in the token payload
      },
      process.env.JWT_SECRET_KEY, // Use secret key from environment variables
      { expiresIn: '30d' } // Set token expiration to 30 days
    );
    res.status(200).json({
      success: true, // Indicate success
      message: 'Logged in successfully', // Success message
      accessToken, // Return the generated access token
    });
  } catch (e) {
    console.error('Error during user login:', e); // Log the error for debugging
    return res.status(500).json({
      success: false, // Indicate failure
      message: 'Something went wrong!', // Generic error message
    });
  }
};

module.exports = { register, verifyEmail, login };
