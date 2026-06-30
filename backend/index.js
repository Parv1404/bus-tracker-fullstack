require('dotenv').config();

const { createApp } = require('./app');
const { startServer } = require('./server');
const { PORT } = require('./config');

const app = createApp();

startServer(app, PORT);
