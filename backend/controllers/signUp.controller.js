const {Bus} = require('../models/bus.models');
const bcrypt = require('bcrypt');

const signUpController = async (req, res) => {
  try {
    const {busNumber, driverName, phoneNumber, busIdentifier, password} = req.body;
    if (!busNumber || !driverName || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const result = await Bus.create({
      busNumber, driverName, phoneNumber, busIdentifier, password: hashed
    });
    const { password: _p, ...safeResult } = result.toObject();
    res.status(201).json(safeResult);
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {signUpController};