const dotenv = require('dotenv');
const { ORS_MATRIX_URL } = require('../config');

dotenv.config();

const API_KEY = process.env.API_KEY;

async function calculateETA(hostelLocation, driverLocation) {
  if (!API_KEY) {
    throw new Error('Missing API_KEY in environment');
  }

  const body = {
    locations: [
      [hostelLocation.longitude, hostelLocation.latitude],
      [driverLocation.longitude, driverLocation.latitude]
    ],
    metrics: ['duration']
  };
  const res = await fetch(ORS_MATRIX_URL, {
    method: 'POST',
    headers: {
      Authorization: API_KEY,
      Accept: 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`ORS error ${res.status}`);
  const data = await res.json();
  console.log('ORS response:', data);

  const etaSeconds = data?.durations?.[0]?.[1];
  if (typeof etaSeconds !== 'number') {
    throw new Error('Invalid ETA response from ORS');
  }

  return etaSeconds;
}

module.exports = { calculateETA };