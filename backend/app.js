const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { corsOptions, serviceArea, stops } = require('./config/index.js');
const { router: driverRouter } = require('./routes/login.router');

function createApp() {
    const app = express();
    app.use(express.json());
    app.use(cors(corsOptions));
    connectDB().catch((error) => {
        console.error('MongoDB startup connection failed:', error.message);
    });

    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    app.get('/stops', (req, res) => {
        res.json({
            stops: Object.keys(stops).map((name) => ({ name })),
            serviceArea,
        });
    });

    app.use('/driver', driverRouter);

    return app;
}

module.exports = { createApp };
