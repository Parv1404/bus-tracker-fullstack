require('dotenv').config();

const ORS_MATRIX_URL = 'https://api.openrouteservice.org/v2/matrix/driving-car';

const stops = {
    'Meerut Central': { latitude: 28.97320794050894, longitude: 77.69064390878778 },
    'Bhainsali Metro Station': { latitude: 28.988271357753305, longitude: 77.7004835176341 },
};

function numberFromEnv(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) ? value : fallback;
}

function integerFromEnv(name, fallback) {
    const value = Number.parseInt(process.env[name], 10);
    return Number.isFinite(value) ? value : fallback;
}

function parseFrontendOrigins() {
    const configured = process.env.FRONTEND_URL;
    const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

    if (!configured) {
        return localOrigins;
    }

    return configured
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

const frontendOrigins = parseFrontendOrigins();

const corsOptions = {
    origin(origin, callback) {
        if (!origin || frontendOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
};

const serviceArea = {
    name: process.env.SERVICE_AREA_NAME || 'Meerut local service area',
    center: {
        latitude: numberFromEnv('SERVICE_AREA_CENTER_LAT', 28.9845),
        longitude: numberFromEnv('SERVICE_AREA_CENTER_LNG', 77.7064),
    },
    radiusKm: numberFromEnv('SERVICE_AREA_RADIUS_KM', 15),
};

const ETA_REQUEST_TIMEOUT_MS = integerFromEnv('ETA_REQUEST_TIMEOUT_MS', 10000);

module.exports = {
    API_KEY: process.env.API_KEY,
    DB_URI: process.env.DB_URI,
    ETA_REQUEST_TIMEOUT_MS,
    FRONTEND_URL: process.env.FRONTEND_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    ORS_MATRIX_URL,
    PORT: integerFromEnv('PORT', 8000),
    corsOptions,
    frontendOrigins,
    serviceArea,
    stops,
};
