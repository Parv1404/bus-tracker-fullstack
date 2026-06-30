process.env.ETA_REQUEST_TIMEOUT_MS = '20';

const test = require('node:test');
const assert = require('node:assert/strict');

const driverManager = require('../services/driverManager');

test('ETA request expires cleanly', async () => {
    driverManager.reset();

    let timedOut = false;
    driverManager.addPending('request-1', {
        studentSocket: { id: 'student-1', connected: true, emit() {} },
        stopName: 'Meerut Central',
        stopLocation: { latitude: 28.9732, longitude: 77.6906 },
        candidateSocketIds: ['driver-1'],
        onTimeout(requestId) {
            timedOut = requestId === 'request-1';
            driverManager.resolvePending(requestId);
        },
    }, 10);

    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.equal(timedOut, true);
    assert.equal(driverManager.hasPending('request-1'), false);
});
