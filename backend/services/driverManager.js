const pendingRequests = new Map();
const driversByBus = new Map();

function registerDriver(busNumber, socketId) {
  driversByBus.set(busNumber, socketId);
}

function unregisterSocket(socketId) {
  for (const [bus, id] of driversByBus.entries()) {
    if (id === socketId) driversByBus.delete(bus);
  }
}

function addPending(requestId, socket, hostel, ttl = 30000) {
  if (!requestId) return;
//   const timeout = setTimeout(() => {
//     pendingRequests.delete(requestId);
//   }, ttl);
  pendingRequests.set(requestId, { socket, hostel /*, timeout */ });
}

function getPending(requestId) {
  return pendingRequests.get(requestId);
}

function hasPending(requestId) {
  return pendingRequests.has(requestId);
}

function resolvePending(requestId) {
  const entry = pendingRequests.get(requestId);
  if (!entry) return;
  // clearTimeout(entry.timeout);
  pendingRequests.delete(requestId);
}

function forEachDriver(cb) {
  for (const socketId of driversByBus.values()) cb(socketId);
}

function hasConnectedDrivers() {
  return driversByBus.size > 0;
}

module.exports = {
  registerDriver,
  unregisterSocket,
  addPending,
  getPending,
  hasPending,
  resolvePending,
  forEachDriver,
  hasConnectedDrivers
};