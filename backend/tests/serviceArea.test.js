process.env.SERVICE_AREA_NAME = 'Test service area';
process.env.SERVICE_AREA_CENTER_LAT = '28.9845';
process.env.SERVICE_AREA_CENTER_LNG = '77.7064';
process.env.SERVICE_AREA_RADIUS_KM = '15';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    haversineDistanceKm,
    isWithinServiceArea,
} = require('../services/serviceArea');

test('haversineDistanceKm calculates an expected city-scale distance', () => {
    const meerutCentral = { latitude: 28.97320794050894, longitude: 77.69064390878778 };
    const bhainsaliMetro = { latitude: 28.988271357753305, longitude: 77.7004835176341 };

    const distance = haversineDistanceKm(meerutCentral, bhainsaliMetro);

    assert.ok(distance > 1.8);
    assert.ok(distance < 2.2);
});

test('isWithinServiceArea accepts coordinates inside the configured service area', () => {
    assert.equal(isWithinServiceArea(28.97320794050894, 77.69064390878778), true);
});

test('isWithinServiceArea rejects coordinates outside the configured service area', () => {
    assert.equal(isWithinServiceArea(40.7128, -74.006), false);
});
