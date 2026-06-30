process.env.JWT_SECRET = 'test-secret';
process.env.SERVICE_AREA_NAME = 'Meerut local service area';
process.env.SERVICE_AREA_CENTER_LAT = '28.9845';
process.env.SERVICE_AREA_CENTER_LNG = '77.7064';
process.env.SERVICE_AREA_RADIUS_KM = '15';
process.env.ETA_REQUEST_TIMEOUT_MS = '50';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const createDriverSocket = require('../sockets/driverSocket');
const driverManager = require('../services/driverManager');

class FakeSocket {
    constructor(id, auth = {}) {
        this.id = id;
        this.handshake = { auth };
        this.connected = true;
        this.handlers = new Map();
        this.emitted = [];
    }

    on(event, handler) {
        this.handlers.set(event, handler);
    }

    emit(event, payload) {
        this.emitted.push({ event, payload });
    }

    clientEmit(event, payload) {
        return this.handlers.get(event)?.(payload);
    }

    disconnect() {
        this.connected = false;
    }
}

function createHarness(etaService) {
    const sockets = new Map();
    const io = {
        connectionHandler: null,
        on(event, handler) {
            if (event === 'connection') {
                this.connectionHandler = handler;
            }
        },
        to(socketId) {
            return {
                emit(event, payload) {
                    sockets.get(socketId)?.emit(event, payload);
                },
            };
        },
    };

    createDriverSocket(io, driverManager, etaService);

    return {
        connect(socket) {
            sockets.set(socket.id, socket);
            io.connectionHandler(socket);
        },
    };
}

function driverToken() {
    return jwt.sign(
        { sub: 'driver-id-1', busNumber: 'BUS-1', driverName: 'Test Driver' },
        process.env.JWT_SECRET
    );
}

test('out-of-area driver coordinates do not call OpenRouteService', async () => {
    driverManager.reset();

    let etaCalls = 0;
    const harness = createHarness({
        async calculateETA() {
            etaCalls += 1;
            return 60;
        },
    });

    const driver = new FakeSocket('driver-1', { token: driverToken() });
    const student = new FakeSocket('student-1');

    harness.connect(driver);
    driver.clientEmit('driver_availability_location', {
        latitude: 28.97320794050894,
        longitude: 77.69064390878778,
    });
    harness.connect(student);

    student.clientEmit('get_eta', { stopName: 'Meerut Central', requestId: 'request-outside' });
    await driver.clientEmit('driver_location_response', {
        requestId: 'request-outside',
        latitude: 40.7128,
        longitude: -74.006,
    });

    assert.equal(etaCalls, 0);
    assert.equal(student.emitted.at(-1).event, 'eta_response_error');
});

test('invalid driver coordinates do not call OpenRouteService', async () => {
    driverManager.reset();

    let etaCalls = 0;
    const harness = createHarness({
        async calculateETA() {
            etaCalls += 1;
            return 60;
        },
    });

    const driver = new FakeSocket('driver-1', { token: driverToken() });
    const student = new FakeSocket('student-1');

    harness.connect(driver);
    driver.clientEmit('driver_availability_location', {
        latitude: 28.97320794050894,
        longitude: 77.69064390878778,
    });
    harness.connect(student);

    student.clientEmit('get_eta', { stopName: 'Meerut Central', requestId: 'request-invalid' });
    await driver.clientEmit('driver_location_response', {
        requestId: 'request-invalid',
        latitude: 999,
        longitude: 999,
    });

    assert.equal(etaCalls, 0);
    assert.equal(student.emitted.at(-1).event, 'eta_response_error');
});
