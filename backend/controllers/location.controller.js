const {Bus} = require("../models/bus.models");
const { getServiceAreaStatus, isValidCoordinate } = require("../services/serviceArea");

const shareLocationController = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const busNumber = req.driver.busNumber;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);

    if (!isValidCoordinate(numericLatitude, numericLongitude)) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    const areaStatus = getServiceAreaStatus(numericLatitude, numericLongitude);

    const updatedDriver = await Bus.findOneAndUpdate(
      { busNumber },
      {
        $set: {
          currentLocation: {
            latitude: numericLatitude,
            longitude: numericLongitude,
            accuracy,
            sharedAt: new Date(),
          },
          serviceAreaStatus: areaStatus.status,
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
