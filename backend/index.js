require('dotenv').config();

const { createApp } = require('./app');
const { startServer } = require('./server');

const app = createApp();
const PORT = process.env.PORT || 8000;

startServer(app, PORT);
