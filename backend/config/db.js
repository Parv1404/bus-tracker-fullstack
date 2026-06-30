const mongoose = require("mongoose");
const { DB_URI } = require('./index');

const connectDB = async () => {
    if (!DB_URI) {
        console.warn("DB_URI is not set. MongoDB connection skipped.");
        return null;
    }

    try {
        const conn = await mongoose.connect(DB_URI);
        console.log("Connected to MongoDB");
        return conn;
    } catch(err) {
        console.error("Error connecting to MongoDB:", err);
        throw err;
    }
}

module.exports = { connectDB, mongoose };
