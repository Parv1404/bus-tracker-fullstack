const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { router: driverRouter } = require('./routes/login.router');
const path = require('path');

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cors());
    connectDB();

    app.use('/driver', driverRouter);

    // serving frontend static files
    //   app.use(express.static(path.join(__dirname, '../frontend/dist')));

    return app;
}

module.exports = { createApp };