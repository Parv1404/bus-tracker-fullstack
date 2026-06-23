import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { BACKEND_URL } from "../config";

export default function DriverLocation() {
    const navigate = useNavigate();
    const location = useLocation();
    const socketRef = useRef(null);

    const [driver] = useState(() => {
        
        try {
            return (
                JSON.parse(localStorage.getItem("driverProfile")) ||
                location.state?.driver ||
                null
            );
        } catch {
            return null;
        }
    });

    const [status, setStatus] = useState("Connecting...");

    // Handle browser Back button
    useEffect(() => {
        const handleBackButton = () => {
            localStorage.removeItem("driverProfile");
            navigate("/driver/login", { replace: true });
        };

        // Add a history entry so the first Back action can be intercepted.
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [navigate]);

    // Socket connection
    useEffect(() => {
        if (!driver?.busNumber) return;

        const socket = io(BACKEND_URL, {
            auth: {
                message: "Driver socket",
                busNumber: driver.busNumber,
            },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setStatus(`Active — Bus ${driver.busNumber}`);
        });

        socket.on("connect_error", () => {
            setStatus("Connection failed.");
        });

        socket.on("request_driver_location", ({ requestId }) => {
            console.log("Received location request:", requestId);

            if (!navigator.geolocation) {
                socket.emit("driver_location_response", {
                    requestId,
                    driverName: driver.driverName,
                    busNumber: driver.busNumber,
                    locationError:
                        "Geolocation not supported by this browser",
                });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    socket.emit("driver_location_response", {
                        requestId,
                        driverName: driver.driverName,
                        busNumber: driver.busNumber,
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        accuracy: coords.accuracy,
                    });
                },
                (err) => {
                    socket.emit("driver_location_response", {
                        requestId,
                        driverName: driver.driverName,
                        busNumber: driver.busNumber,
                        locationError:
                            err.message || "Failed to get location",
                    });
                },
                {
                    enableHighAccuracy: true,
                }
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [driver]);

    const handleLogout = () => {
        localStorage.removeItem("driverProfile");

        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        navigate("/driver/login", { replace: true });
    };

    // Protect route
    if (!driver || !localStorage.getItem("driverProfile")) {
        return <Navigate to="/driver/login" replace />;
    }

    return (
        <div className="container auth-page location-page">
            <section className="hero">
                <h1>Driver Dashboard</h1>
                <p>Share your live location with the tracking system.</p>
            </section>

            <section className="card auth-card location-card">
                <p>
                    <strong>{driver.driverName}</strong> — Bus{" "}
                    {driver.busNumber}
                </p>

                <p className="location-status">{status}</p>

                <p className="auth-switch">
                    Switch account?{" "}
                    <button
                        onClick={handleLogout}
                        style={{
                            background: "none",
                            border: "none",
                            color: "blue",
                            cursor: "pointer",
                            padding: 0,
                            textDecoration: "underline",
                        }}
                    >
                        Logout
                    </button>
                </p>
            </section>
        </div>
    );
}