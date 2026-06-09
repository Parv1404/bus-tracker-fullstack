const { mongoose } = require("../config/db");

const pilotSchema = new mongoose.Schema(
    {
        busNumber : {
            type : String,
            required : true,
            trim : true
        },
        // driverName : {
        //     type : String,
        //     required : true,
        //     trim : true
        // },
        // conductorName : {
        //     type : String,
        //     required : true,
        //     trim : true
        // },
        // driverMobileNumber : {
        //     type : Number,
        //     required : true,
        //     trim : true
        // },
        // conductorMobileNumber : {
        //     type : Number,
        //     required : true,
        //     trim : true
        // },
        busColor : {
            type : String,
            required : true,
            trim : true
        }
    }
);

const pilots = mongoose.model('Pilot', pilotSchema);
module.exports = pilots;
