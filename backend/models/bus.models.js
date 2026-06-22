const mongoose = require('mongoose');
const { Schema } = mongoose;

const busSchema = new Schema({
    busNumber: {
        type: String,
        required: true
    },
    driverName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    busIdentifier: {
        type: String,
    },
    password: {
        type: String,
        required: true
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
    }
})

const Bus = mongoose.model("Bus", busSchema);

module.exports = { Bus };