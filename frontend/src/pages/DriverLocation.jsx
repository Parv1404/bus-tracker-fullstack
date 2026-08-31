import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Navigate, useNavigate } from "react-router-dom";

import { BACKEND_URL, clearDriverSession, getDriverToken, getStoredDriver } from "../config";

function formatStatus(status) {
    if (status === "inside_service_area") return "Active - inside service area";
    if (status === "outside_service_area") return "Outside service area - live ETA requests are disabled";
    if (status === "gps_unavailable") return "GPS unavailable - live ETA requests are disabled";
    if (status === "invalid_location") return "Invalid GPS location - live ETA requests are disabled";
    return "Checking service-area eligibility...";
}

function getCurrentLocation() {
    return new Promise((resolve) => {
        if(!navigator.geolocation) {
            resolve({ locationError: "Geolocation is not supported by this browser" });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                resolve({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    accuracy: coords.accuracy,
                });
            },
            (error) => {
                resolve({ locationError: error.message || "Failed to get location" });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

export default function DriverLocation() {
    const navigate = useNavigate();
    const socketRef = useRef(null);

    const [token] = useState(() => getDriverToken());
    const [driver] = useState(() => getStoredDriver());
    const [socketState, setSocketState] = useState("Connecting...");
    const [serviceStatus, setServiceStatus] = useState("unknown");
    const [gpsProblem, setGpsProblem] = useState("");
    const [lastLocationAt, setLastLocationAt] = useState("");
    const [serviceAreaName, setServiceAreaName] = useState("");

    useEffect(() => {
        if (!token) return undefined;

        const socket = io(BACKEND_URL, {
            auth: { token },
        });

        socketRef.current = socket;

        const sendLocation = async (eventName, requestId) => {
            const location = await getCurrentLocation();
            socket.emit(eventName, requestId ? { requestId, ...location } : location);

            if(location.locationError) {
                setGpsProblem(location.locationError);
            }
        };

        socket.on("connect", () => {
            setSocketState("Connected");
        });

        socket.on("disconnect", () => {
            setSocketState("Disconnected");
        });

        socket.on("connect_error", (error) => {
            setSocketState(error.message || "Connection failed");
        });

        socket.on("driver_auth_error", ({ error }) => {
            setSocketState(error || "Driver authentication failed");
            clearDriverSession();
            navigate("/driver/login", { replace: true });
        });

        socket.on("verify_driver_location", () => {
            sendLocation("driver_availability_location");
        });

        socket.on("request_driver_location", ({ requestId }) => {
            sendLocation("driver_location_response", requestId);
        });

        socket.on("driver_status", (status) => {
            setServiceStatus(status.serviceAreaStatus);
            setServiceAreaName(status.serviceArea?.name || "");
            setGpsProblem(status.error || "");
            if (status.lastLocationAt) {
                setLastLocationAt(new Date(status.lastLocationAt).toLocaleString());
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [navigate, token]);

    const handleLogout = () => {
        clearDriverSession();

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        navigate("/driver/login", { replace: true });
    };

    if (!token || !driver) {
        return <Navigate to="/driver/login" replace />;
    }

    return (
        <div className="container auth-page location-page">
            <section className="hero compact-hero">
                <h1>Driver Dashboard</h1>
                <p>Real browser geolocation only. No demo or manual GPS mode.</p>
            </section>

            <section className="card auth-card location-card">
                <div className="driver-summary">
                    <p><strong>Bus number:</strong> {driver.busNumber}</p>
                    <p><strong>Driver:</strong> {driver.driverName}</p>
                    <p><strong>Socket:</strong> {socketState}</p>
                    <p><strong>Eligibility:</strong> {formatStatus(serviceStatus)}</p>
                    {serviceAreaName && <p><strong>Service area:</strong> {serviceAreaName}</p>}
                    <p><strong>Last location update:</strong> {lastLocationAt || "Not available yet"}</p>
                </div>

                {gpsProblem && (
                    <div className="eta-box error">
                        {gpsProblem}
                    </div>
                )}

                <p className="helper-text">
                    This dashboard checks location once on startup, then sends a fresh GPS location only when a student requests an ETA.
                </p>

                <button type="button" onClick={handleLogout}>
                    Logout
                </button>
            </section>
        </div>
    );
}
