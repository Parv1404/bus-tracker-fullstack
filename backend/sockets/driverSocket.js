const { serviceArea, stops } = require('../config');
const { verifyDriverToken } = require('../middleware/auth');
const { getServiceAreaStatus, isValidCoordinate } = require('../services/serviceArea');

function friendlyEtaError(entry) {
    if (entry.validEtas.length > 0) return null;

    const failures = entry.failures.map((failure) => failure.type);

    if (failures.includes('ors_error')) {
        return 'ETA service is temporarily unavailable. Please try again.';
    }

    if (failures.length > 0 && failures.every((type) => type === 'location_error')) {
        return 'Driver GPS is unavailable right now. Please ask the driver to allow location access and try again.';
    }

    if (failures.length > 0 && failures.every((type) => type === 'outside_service_area')) {
        return `No active bus is currently available in the ${serviceArea.name}.`;
    }

    if (failures.length > 0 && failures.every((type) => type === 'invalid_location')) {
        return 'Driver GPS returned an invalid location. Please try again.';
    }

    return 'No driver responded with a usable GPS location before timeout.';
}

function emitDriverStatus(socket, driver, statusDetails) {
    socket.emit('driver_status', {
        busNumber: driver.busNumber,
        driverName: driver.driverName,
        serviceAreaStatus: statusDetails.status,
        serviceArea,
        eligible: statusDetails.eligible,
        distanceKm: statusDetails.distanceKm,
        lastLocationAt: new Date().toISOString(),
    });
}

function finalizeEtaRequest(driverManager, requestId) {
    const entry = driverManager.resolvePending(requestId);
    if (!entry || !entry.studentSocket.connected) return;

    if (entry.validEtas.length > 0) {
        const fastest = entry.validEtas.sort((a, b) => a.eta - b.eta)[0];
        entry.studentSocket.emit('eta_response', fastest);
        return;
    }

    entry.studentSocket.emit('eta_response_error', { error: friendlyEtaError(entry) });
}

function updateDriverAvailability(driverManager, socket, payload) {
    const driver = driverManager.getDriver(socket.id);
    if (!driver) return;

    if (payload.locationError) {
        driverManager.updateDriverStatus(socket.id, 'gps_unavailable');
        socket.emit('driver_status', {
            busNumber: driver.busNumber,
            driverName: driver.driverName,
            serviceAreaStatus: 'gps_unavailable',
            serviceArea,
            eligible: false,
            error: payload.locationError,
        });
        return;
    }

    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);
    const statusDetails = getServiceAreaStatus(latitude, longitude);

    driverManager.updateDriverStatus(socket.id, statusDetails.status, {
        latitude,
        longitude,
        accuracy: payload.accuracy,
        sharedAt: new Date(),
    });

    emitDriverStatus(socket, driver, statusDetails);
}

module.exports = function createDriverSocket(io, driverManager, etaService) {
    io.on('connection', (socket) => {
        const { token } = socket.handshake.auth || {};

        if (token) {
            try {
                const payload = verifyDriverToken(token);
                driverManager.registerDriver(
                    {
                        busNumber: payload.busNumber,
                        driverId: payload.sub,
                        driverName: payload.driverName,
                    },
                    socket.id
                );
                console.log(`Driver registered - Bus ${payload.busNumber}: ${socket.id}`);
                socket.emit('verify_driver_location');
            } catch (error) {
                socket.emit('driver_auth_error', { error: 'Invalid or expired driver token' });
                socket.disconnect(true);
                return;
            }
        } else {
            console.log('Student/client connected:', socket.id);
        }

        socket.on('get_eta', ({ stopName, hostel, requestId }) => {
            const requestedStop = stopName || hostel;
            const stopLocation = stops[requestedStop];

            if (!requestId) {
                socket.emit('eta_response_error', { error: 'Invalid ETA request. Please try again.' });
                return;
            }

            if (!stopLocation) {
                socket.emit('eta_response_error', { error: 'Please choose a supported local stop.' });
                return;
            }

            if (!driverManager.hasConnectedDrivers()) {
                socket.emit('eta_response_error', { error: 'No drivers connected' });
                return;
            }

            const eligibleDrivers = driverManager.getEligibleDrivers();
            if (eligibleDrivers.length === 0) {
                socket.emit('eta_response_error', {
                    error: `No active bus is currently available in the ${serviceArea.name}.`,
                });
                return;
            }

            driverManager.addPending(requestId, {
                studentSocket: socket,
                stopName: requestedStop,
                stopLocation,
                candidateSocketIds: eligibleDrivers.map((driver) => driver.socketId),
                onTimeout: (pendingRequestId) => finalizeEtaRequest(driverManager, pendingRequestId),
            });

            eligibleDrivers.forEach((driver) => {
                io.to(driver.socketId).emit('request_driver_location', { requestId });
            });
        });

        socket.on('driver_availability_location', (payload) => {
            updateDriverAvailability(driverManager, socket, payload);
        });

        socket.on('driver_location_response', async ({ requestId, latitude, longitude, accuracy, locationError }) => {
            if (!driverManager.hasPending(requestId)) return;

            const driver = driverManager.getDriver(socket.id);
            const pending = driverManager.getPending(requestId);

            if (!driver || !pending?.candidateSocketIds.has(socket.id)) return;
            if (!driverManager.markDriverResponded(requestId, socket.id)) return;

            if (locationError) {
                driverManager.updateDriverStatus(socket.id, 'gps_unavailable');
                driverManager.addFailure(requestId, { type: 'location_error', busNumber: driver.busNumber });
            } else {
                const numericLatitude = Number(latitude);
                const numericLongitude = Number(longitude);

                if (!isValidCoordinate(numericLatitude, numericLongitude)) {
                    driverManager.updateDriverStatus(socket.id, 'invalid_location');
                    driverManager.addFailure(requestId, { type: 'invalid_location', busNumber: driver.busNumber });
                } else {
                    const statusDetails = getServiceAreaStatus(numericLatitude, numericLongitude);
                    driverManager.updateDriverStatus(socket.id, statusDetails.status, {
                        latitude: numericLatitude,
                        longitude: numericLongitude,
                        accuracy,
                        sharedAt: new Date(),
                    });
                    emitDriverStatus(socket, driver, statusDetails);

                    if (!statusDetails.eligible) {
                        driverManager.addFailure(requestId, { type: 'outside_service_area', busNumber: driver.busNumber });
                    } else {
                        try {
                            const etaSeconds = await etaService.calculateETA(pending.stopLocation, {
                                latitude: numericLatitude,
                                longitude: numericLongitude,
                            });
                            driverManager.addValidEta(requestId, {
                                driverName: driver.driverName,
                                busNumber: driver.busNumber,
                                eta: etaSeconds,
                            });
                        } catch (err) {
                            console.error('ETA calculation failed:', err.message);
                            driverManager.addFailure(requestId, { type: 'ors_error', busNumber: driver.busNumber });
                        }
                    }
                }
            }

            if (driverManager.allCandidatesResponded(requestId)) {
                finalizeEtaRequest(driverManager, requestId);
            }
        });

        socket.on('disconnect', () => {
            driverManager.unregisterSocket(socket.id);
            driverManager.resolvePendingForStudent(socket.id);
            console.log('Socket disconnected:', socket.id);
        });
    });
};

module.exports._test = {
    finalizeEtaRequest,
    friendlyEtaError,
};
