const mongoose = require('mongoose');
const { Schema } = mongoose;

const busSchema = new Schema({
    busNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    driverName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    busIdentifier: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    currentLocation: {
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },
        accuracy: {
            type: Number
        },
        sharedAt: {
            type: Date
        }
    },
    serviceAreaStatus: {
        type: String,
        enum: ['unknown', 'inside_service_area', 'outside_service_area', 'invalid_location', 'gps_unavailable'],
        default: 'unknown'
    }
}, { timestamps: true })

const Bus = mongoose.model("Bus", busSchema);

module.exports = { Bus };
