const { API_KEY, ORS_MATRIX_URL } = require('../config');

async function calculateETA(stopLocation, driverLocation) {
    if (!API_KEY) {
        throw new Error('Missing API_KEY in environment');
    }

    // const body = {
    //     locations: [
    //         [stopLocation.longitude, stopLocation.latitude],
    //         [driverLocation.longitude, driverLocation.latitude],
    //     ],
    //     metrics: ['duration'],
    // };

    const body =
    {
        "origins": [
            {
                "point": { "latitude": driverLocation.latitude, "longitude": driverLocation.longitude }
            }
        ],
        "destinations": [
            {
                "point": { "latitude": stopLocation.latitude, "longitude": stopLocation.longitude }
            }
        ],
        "options": {
            "departAt": "now",
            "routeType": "fastest",
            "traffic": "live",
            "travelMode": "car"
        }
    }

    const res = await fetch(`https://api.tomtom.com/routing/matrix/2?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    // const res = await fetch(ORS_MATRIX_URL, {
    //     method: 'POST',
    //     headers: {
    //         Authorization: API_KEY,
    //         Accept: 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
    //         'Content-Type': 'application/json; charset=utf-8',
    //     },
    //     body: JSON.stringify(body),
    // });

    if (!res.ok) {
        console.log();

        throw new Error(`API error ${res.status}`);
    }

    const data = await res.json();
    console.log(data);

    // const etaSeconds = data?.durations?.[0]?.[1];
    const etaSeconds = data.data[0].routeSummary.travelTimeInSeconds;

    console.log(etaSeconds);
    
    if (typeof etaSeconds !== 'number') {
        throw new Error('Invalid ETA response from ORS');
    }

    return etaSeconds;
}

module.exports = { calculateETA };
