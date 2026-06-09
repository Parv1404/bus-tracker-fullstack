const bcrypt = require("bcrypt");
const {Bus} = require("../models/bus.models");

const loginController = async (req, res) => {
  try {
    const { driverName, password } = req.body;

    if (!driverName || !password) {
      return res.status(400).json({
        message: "Driver name and password are required",
      });
    }

    const driver = await Bus.findOne({ driverName });

    if (!driver) {
      return res.status(401).json({
        message: "Invalid driver name or password",
      });
    }

    const isMatch = await bcrypt.compare(password, driver.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid driver name or password",
      });
    }

    const { password: _, ...safeDriver } = driver.toObject();

    return res.status(200).json({
      message: "Login successful",
      driver: safeDriver,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { loginController };