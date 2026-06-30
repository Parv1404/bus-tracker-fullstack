const { mongoose } = require("../config/db");

// Legacy model kept only for historical data compatibility. The active driver
// authentication/location model is Bus in bus.models.js.
const pilotSchema = new mongoose.Schema(
    {
        busNumber : {
            type : String,
            required : true,
            trim : true
        },
        busColor : {
            type : String,
            required : true,
            trim : true
        }
    }
);

const pilots = mongoose.model('Pilot', pilotSchema);
module.exports = pilots;
