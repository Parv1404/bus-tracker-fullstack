const { ETA_REQUEST_TIMEOUT_MS } = require('../config');

const pendingRequests = new Map();
const driversBySocket = new Map();
const socketByBus = new Map();

function registerDriver(identity, socketId) {
    const previousSocketId = socketByBus.get(identity.busNumber);
    if(previousSocketId && previousSocketId !== socketId) {
        driversBySocket.delete(previousSocketId);
    }

    const driver = {
        socketId,
        busNumber: identity.busNumber,
        driverId: identity.driverId,
        driverName: identity.driverName,
        serviceAreaStatus: 'unknown',
        currentLocation: null,
        lastLocationAt: null,
        lastSeenAt: new Date(),
    };

    socketByBus.set(identity.busNumber, socketId);
    driversBySocket.set(socketId, driver);
    return driver;
}

function unregisterSocket(socketId) {
    const driver = driversBySocket.get(socketId);
    if (driver) {
        socketByBus.delete(driver.busNumber);
    }

    driversBySocket.delete(socketId);
}

function getDriver(socketId) {
    return driversBySocket.get(socketId) || null;
}

function updateDriverStatus(socketId, status, location = null) {
    const driver = driversBySocket.get(socketId);
    if (!driver) return null;

    driver.serviceAreaStatus = status;
    driver.lastSeenAt = new Date();

    if (location) {
        driver.currentLocation = location;
        driver.lastLocationAt = location.sharedAt || new Date();
    }

    return driver;
}

function getConnectedDrivers() {
    return Array.from(driversBySocket.values());
}

function getEligibleDrivers() {
    return getConnectedDrivers().filter((driver) => driver.serviceAreaStatus === 'inside_service_area');
}

function hasConnectedDrivers() {
    return driversBySocket.size > 0;
}

function addPending(requestId, request, ttl = ETA_REQUEST_TIMEOUT_MS) {
    if (!requestId) return null;

    const timeout = setTimeout(() => {
        if(pendingRequests.has(requestId)) {
            request.onTimeout(requestId);
        }
    }, ttl);

    const entry = {
        ...request,
        candidateSocketIds: new Set(request.candidateSocketIds),
        respondedSocketIds: new Set(),
        validEtas: [],
        failures: [],
        timeout,
    };

    pendingRequests.set(requestId, entry);
    return entry;
}

function getPending(requestId) {
    return pendingRequests.get(requestId) || null;
}

function hasPending(requestId) {
    return pendingRequests.has(requestId);
}

function markDriverResponded(requestId, socketId) {
    const entry = pendingRequests.get(requestId);
    if (!entry || !entry.candidateSocketIds.has(socketId) || entry.respondedSocketIds.has(socketId)) {
        return false;
    }

    entry.respondedSocketIds.add(socketId);
    return true;
}

function addValidEta(requestId, etaResult) {
    const entry = pendingRequests.get(requestId);
    if (entry) {
        entry.validEtas.push(etaResult);
    }
}

function addFailure(requestId, failure) {
    const entry = pendingRequests.get(requestId);
    if (entry) {
        entry.failures.push(failure);
    }
}

function allCandidatesResponded(requestId) {
    const entry = pendingRequests.get(requestId);
    return Boolean(entry && entry.respondedSocketIds.size >= entry.candidateSocketIds.size);
}

function resolvePending(requestId) {
    const entry = pendingRequests.get(requestId);
    if (!entry) return null;

    clearTimeout(entry.timeout);
    pendingRequests.delete(requestId);
    return entry;
}

function resolvePendingForStudent(socketId) {
    for (const [requestId, entry] of pendingRequests.entries()) {
        if (entry.studentSocket.id === socketId) {
            resolvePending(requestId);
        }
    }
}

function reset() {
    for (const entry of pendingRequests.values()) {
        clearTimeout(entry.timeout);
    }
    pendingRequests.clear();
    driversBySocket.clear();
    socketByBus.clear();
}

module.exports = {
    addFailure,
    addPending,
    addValidEta,
    allCandidatesResponded,
    getConnectedDrivers,
    getDriver,
    getEligibleDrivers,
    getPending,
    hasConnectedDrivers,
    hasPending,
    markDriverResponded,
    registerDriver,
    reset,
    resolvePending,
    resolvePendingForStudent,
    unregisterSocket,
    updateDriverStatus,
};
