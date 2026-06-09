const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { router: driverRouter } = require('./routes/login.router');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cors());
  connectDB();
  app.use('/driver', driverRouter);
  return app;
}

module.exports = { createApp };