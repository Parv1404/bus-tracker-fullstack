const localBackendUrl = `${window.location.protocol}//${window.location.hostname}:8000`;

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || localBackendUrl).replace(/\/$/, "");

export const DRIVER_TOKEN_KEY = "driverToken";
export const DRIVER_PROFILE_KEY = "driverProfile";

export function getDriverToken() {
    return localStorage.getItem(DRIVER_TOKEN_KEY);
}

export function getStoredDriver() {
    try {
        return JSON.parse(localStorage.getItem(DRIVER_PROFILE_KEY));
    } catch {
        return null;
    }
}

export function clearDriverSession() {
    localStorage.removeItem(DRIVER_TOKEN_KEY);
    localStorage.removeItem(DRIVER_PROFILE_KEY);
}
