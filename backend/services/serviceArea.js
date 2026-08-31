const { serviceArea } = require('../config');

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function isValidCoordinate(latitude, longitude) {
    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

function haversineDistanceKm(pointA, pointB) {
    if (!isValidCoordinate(pointA.latitude, pointA.longitude) || !isValidCoordinate(pointB.latitude, pointB.longitude)) {
        throw new Error('Invalid coordinate');
    }

    const deltaLat = toRadians(pointB.latitude - pointA.latitude);
    const deltaLng = toRadians(pointB.longitude - pointA.longitude);
    const latA = toRadians(pointA.latitude);
    const latB = toRadians(pointB.latitude);

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLng / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isWithinServiceArea(latitude, longitude, area = serviceArea) {
    if (!isValidCoordinate(latitude, longitude)) {
        return false;
    }

    const distanceKm = haversineDistanceKm(area.center, { latitude, longitude });
    return distanceKm <= area.radiusKm;
}

function getServiceAreaStatus(latitude, longitude) {
    if(!isValidCoordinate(latitude, longitude)) {
        return {
            status: 'invalid_location',
            eligible: false,
            distanceKm: null,
        };
    }

    const distanceKm = haversineDistanceKm(serviceArea.center, { latitude, longitude });
    const eligible = distanceKm <= serviceArea.radiusKm;

    return {
        status: eligible ? 'inside_service_area' : 'outside_service_area',
        eligible,
        distanceKm,
    };
}

module.exports = {
    getServiceAreaStatus,
    haversineDistanceKm,
    isValidCoordinate,
    isWithinServiceArea,
};
