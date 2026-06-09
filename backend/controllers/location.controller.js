const {Bus} = require("../models/bus.models");

const shareLocationController = async (req, res) => {
  try {
    const { driverName, busNumber, latitude, longitude, accuracy } = req.body;

    if (!driverName || !busNumber || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Driver name, bus number, latitude, and longitude are required",
      });
    }

    const updatedDriver = await Bus.findOneAndUpdate(
      { driverName, busNumber },
      {
        $set: {
          currentLocation: {
            latitude,
            longitude,
            accuracy,
            sharedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const { password, ...safeDriver } = updatedDriver.toObject();

    return res.status(200).json({
      message: "Location shared successfully",
      driver: safeDriver,
    });
  } catch (error) {
    console.error("Location share error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { shareLocationController };