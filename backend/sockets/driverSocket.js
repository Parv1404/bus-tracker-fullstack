const { hostelLocations } = require('../config');

module.exports = function createDriverSocket(io, driverManager, etaService) {
    // console.log("inside socket");

    io.on('connection', (socket) => {
        const { busNumber } = socket.handshake.auth || {};
        if (busNumber) {
            driverManager.registerDriver(busNumber, socket.id);
            console.log(`Driver registered — Bus ${busNumber}: ${socket.id}`);
        } else {
            console.log('Client connected:', socket.id);
        }

        socket.on('get_eta', ({ hostel, requestId }) => {
            driverManager.addPending(requestId, socket, hostel);
            // checking if there is any driver connected
            if (driverManager.hasConnectedDrivers()) {
                driverManager.forEachDriver((driverSocketId) => {
                    io.to(driverSocketId).emit('request_driver_location', { requestId });
                });
            } else {
                socket.emit('eta_response_error', { error: 'No drivers connected' });
                driverManager.resolvePending(requestId);
            }
        });

        socket.on('driver_location_response', async ({ requestId, driverName, busNumber, latitude, longitude, accuracy, locationError }) => {
            if (!driverManager.hasPending(requestId)) return;
            console.log(`Received location from Bus ${busNumber} (${driverName}):`, { latitude, longitude, accuracy, locationError });
            const pending = driverManager.getPending(requestId);

            const hostel = pending.hostel;
            const hostelLocation = hostelLocations[hostel];
            if (!hostelLocation) {
                pending.socket.emit('eta_response_error', { error: 'Unknown hostel' });
                driverManager.resolvePending(requestId);
                return;
            }
            try {
                const etaSeconds = await etaService.calculateETA(hostelLocation, { latitude, longitude });
                pending.socket.emit('eta_response', { driverName, busNumber, eta: etaSeconds });
            } catch (err) {
                pending.socket.emit('eta_response_error', { error: 'ETA calculation failed' });
            } finally {
                driverManager.resolvePending(requestId);
            }
        });

        socket.on('disconnect', () => {
            driverManager.unregisterSocket(socket.id);
            console.log('Socket disconnected:', socket.id);
        });
    });
};