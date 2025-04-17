const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../helpers/SendEmail.helper');

const register = async (req, res) => {
  // New session transaction
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Extract user information from request body
    const { username, email, password, role } = req.body;

    // Check if User is already exist on database
    const checkExistingUser = await User.findOne(
      { $or: [{ username }, { email }] },
      null,
      { session }
    );

    if (checkExistingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message:
          'User is alredy exists either with same username or same email. Please try a different username or email',
      });
    }

    // Hash user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // User verification
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user and save in database
    const newlyCreatedUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      verificationToken,
      createdAt: new Date(),
    });

    await newlyCreatedUser.save({ session });

    // Commit transaction if both operation succeed
    await session.commitTransaction();
    session.endSession();

    // Send email AFTER transaction is successful
    const baseUrl = process.env.BASE_URL;
    const verificationUrl = `${baseUrl}/api/auth/verify/${verificationToken}`;
    const html = `<p>Click to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`;

    await sendEmail({
      to: email,
      subject: 'Verify your Email',
      html,
    });

    res.status(200).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error during user registration:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    // Extract the 'token' parameter from the request URL
    const { token } = req.params;

    // Attempt to find a user in the database whose 'verificationToken' matches the provided token
    const user = await User.findOne({ verificationToken: token });

    // If no user is found, it means the token is invalid or expired
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });
    }

    // If a user is found, mark the user as verified
    user.verified = true;

    // Remove the verification token to prevent reuse
    user.verificationToken = undefined;

    // Save the updated user object to the database
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: 'Email verified successfully.' });
  } catch (e) {
    console.error('Error during user verification:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

const login = async (req, res) => {
  try {
    // Extract user information from request body
    const { email, password } = req.body;

    // Find if current user is exist in database or not
    const user = await User.findOne({
      email,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User doesn`t exists!',
      });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in.',
      });
    }

    // If password match
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials!',
      });
    }

    // Creaet JWT token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '30d' }
    );
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      accessToken,
    });
  } catch (e) {
    console.error('Error during user login:', e);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

module.exports = { register, verifyEmail, login };
