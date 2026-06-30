const bcrypt = require("bcrypt");
const {Bus} = require("../models/bus.models");
const { signDriverToken } = require("../middleware/auth");

const loginController = async (req, res) => {
  try {
    const { busNumber, password } = req.body;

    if (!busNumber || !password) {
      return res.status(400).json({
        message: "Bus number and password are required",
      });
    }

    const driver = await Bus.findOne({ busNumber: busNumber.trim() }).select("+password");

    if (!driver) {
      return res.status(401).json({
        message: "Invalid bus number or password",
      });
    }

    const isMatch = await bcrypt.compare(password, driver.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid bus number or password",
      });
    }

    const { password: _, ...safeDriver } = driver.toObject();
    const token = signDriverToken(driver);

    return res.status(200).json({
      message: "Login successful",
      driver: safeDriver,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { loginController };
