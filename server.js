require('dotenv').config();
const express = require('express');
const connectToDB = require('./database/MongoDB');
const { authRoutes } = require('./config/routes.conf');

const app = express();
const PORT = process.env.PORT;

// Connect to DB
connectToDB();

// Middleware
app.use(express.json);

// Routes
app.use('/api/auth', authRoutes);

// Listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
