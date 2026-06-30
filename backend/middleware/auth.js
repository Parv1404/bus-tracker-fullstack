const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const { Bus } = require('../models/bus.models');

function getJwtSecret() {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is required');
    }

    return JWT_SECRET;
}

function signDriverToken(driver) {
    return jwt.sign(
        {
            sub: driver._id.toString(),
            busNumber: driver.busNumber,
            driverName: driver.driverName,
        },
        getJwtSecret(),
        { expiresIn: '12h' }
    );
}

function verifyDriverToken(token) {
    return jwt.verify(token, getJwtSecret());
}

async function requireDriverAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Driver authentication required' });
        }

        const payload = verifyDriverToken(token);
        const driver = await Bus.findById(payload.sub).select('-password');

        if (!driver) {
            return res.status(401).json({ message: 'Driver account no longer exists' });
        }

        req.driver = driver;
        req.driverToken = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired driver token' });
    }
}

module.exports = {
    requireDriverAuth,
    signDriverToken,
    verifyDriverToken,
};
