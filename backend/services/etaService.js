const { API_KEY, ORS_MATRIX_URL } = require('../config');

async function calculateETA(stopLocation, driverLocation) {
    if (!API_KEY) {
        throw new Error('Missing API_KEY in environment');
    }

    const body = {
        locations: [
            [stopLocation.longitude, stopLocation.latitude],
            [driverLocation.longitude, driverLocation.latitude],
        ],
        metrics: ['duration'],
    };

    const res = await fetch(ORS_MATRIX_URL, {
        method: 'POST',
        headers: {
            Authorization: API_KEY,
            Accept: 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`ORS error ${res.status}`);

    const data = await res.json();
    const etaSeconds = data?.durations?.[0]?.[1];

    if (typeof etaSeconds !== 'number') {
        throw new Error('Invalid ETA response from ORS');
    }

    return etaSeconds;
}

module.exports = { calculateETA };
