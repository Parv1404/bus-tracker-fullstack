const fallbackBackendUrl = `${window.location.protocol}//${window.location.hostname}:8000`;

export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || fallbackBackendUrl;