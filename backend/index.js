const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const {connectDB} = require("./config/db");
const {router} = require('./routes/login.router');
const { log } = require("console");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const driversByBus = new Map();           // busNumber -> socket.id
const pendingRequests = new Map();     // requestId -> { socket, hostel }

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(socket.handshake.auth, ": ", socket.id);
    if (socket.handshake.auth.busNumber) {
        driversByBus.set(socket.handshake.auth.busNumber, socket.id);
        console.log(`Driver registered — Bus ${socket.handshake.auth.busNumber}: ${socket.id}`);
    }

    socket.on("get_eta", ({hostel, requestId}) => {
        console.log("ETA requested for:", hostel, requestId);
        console.log("Drivers online:", [...driversByBus.entries()]);
        pendingRequests.set(requestId, { socket, hostel });
        driversByBus.forEach((driverSocketId) => {
            io.to(driverSocketId).emit("request_driver_location", { requestId });
        });
    });

    socket.on("driver_location_response", ({ requestId, driverName, busNumber, latitude, longitude, accuracy }) => {
        console.log(`Location response from ${driverName} (Bus ${busNumber}):`, { latitude, longitude, accuracy });
        if (!pendingRequests.has(requestId)) {
            console.log("No pending request found for requestId:", requestId);
            return;
        }
        // Fetch the hostel location based on the requestId
        const hostelLocations = {
            "Meerut Central": { latitude: 28.97320794050894, longitude: 77.69064390878778 }, // WCH-1
            "Bhainsali": { latitude: 28.988271357753305, longitude: 77.7004835176341 }, // WCH-4
            "Hostel 3": { latitude: 26.5019571167949, longitude: 80.27857129610099 }, // WCH-5
            "Hostel 4": { latitude: 26.5029571167949, longitude: 80.27957129610099 }, // WCH-6
        };
        const hostelLocation = hostelLocations[pendingRequests.get(requestId).hostel];

        // Here you would calculate ETA based on the driver's location and the hostel location.
        const duration = async () => {
        try {   
            const result = await fetch('https://api.openrouteservice.org/v2/matrix/foot-walking',{
                method : 'POST',
                headers : {
                    'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization' : process.env.API_KEY
                },
                body : JSON.stringify({
                    "locations" : [
                        [hostelLocation.longitude, hostelLocation.latitude], // hostel as [lon, lat]
                        [longitude, latitude],                   // driver as [lon, lat]
                    ],
                    "metrics" : ["duration"]
                })
            });
            const data = await result.json();
            console.log("Result:", data);
            const requestInfo = pendingRequests.get(requestId);
            if (requestInfo) {
                requestInfo.socket.emit("eta_response", {
                    driverName,
                    busNumber,
                    eta: data.durations[0][1] // Assuming the first location is the student's location and the second is the driver's location
                });
            }

        } catch(error) {
            console.log("Error:", error);
            res.status(500).json({error: "An error occurred while fetching the duration"});
        }
        };

        duration();
    });
    socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    });
});

// Connect to MongoDB
connectDB();

app.use('/driver', router);

server.listen(8000, () => {
    console.log("Server listening at PORT 8000");
});

// 26.5009571167949, 80.27757129610099 --> WCH-4
// 26.49988174108725, 80.2812727446431  --> WCH-3
// 26.49936513331444, 80.28804953075276 --> WCH-1

// 77.7004835176341, 28.988271357753305 --> Bhainsali
