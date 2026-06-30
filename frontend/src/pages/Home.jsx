import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";

import { BACKEND_URL } from "../config";

const initialResult = {
    type: "idle",
    message: "",
    details: null,
};

export default function Home() {
    const [selectedStop, setSelectedStop] = useState("");
    const [stops, setStops] = useState([]);
    const [stopsStatus, setStopsStatus] = useState("loading");
    const [socketConnected, setSocketConnected] = useState(false);
    const [result, setResult] = useState(initialResult);
    const [isRequesting, setIsRequesting] = useState(false);

    const socketRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        async function loadStops() {
            try {
                const response = await fetch(`${BACKEND_URL}/stops`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || "Unable to load stops");
                }

                if (isMounted) {
                    setStops(data.stops || []);
                    setStopsStatus("ready");
                }
            } catch (error) {
                if (isMounted) {
                    setStopsStatus("error");
                    setResult({
                        type: "error",
                        message: error.message || "Unable to load local stops.",
                        details: null,
                    });
                }
            }
        }

        loadStops();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const socket = io(BACKEND_URL);
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketConnected(true);
        });

        socket.on("disconnect", () => {
            setSocketConnected(false);
        });

        socket.on("connect_error", () => {
            setSocketConnected(false);
        });

        socket.on("eta_response", ({ driverName, busNumber, eta }) => {
            setResult({
                type: "success",
                message: "ETA found",
                details: {
                    driverName,
                    busNumber,
                    minutes: Math.max(1, Math.round(eta / 60)),
                },
            });
            setIsRequesting(false);
        });

        socket.on("eta_response_error", ({ error }) => {
            setResult({
                type: "error",
                message: error || "Unable to fetch ETA.",
                details: null,
            });
            setIsRequesting(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleEta = () => {
        if (!socketRef.current || !selectedStop) return;

        setResult({
            type: "loading",
            message: "Requesting a fresh driver location...",
            details: null,
        });
        setIsRequesting(true);

        socketRef.current.emit("get_eta", {
            stopName: selectedStop,
            requestId: `${selectedStop}-${Date.now()}`,
        });
    };

    return (
        <div className="container">
            <div className="hero compact-hero">
                <div className="hero-top">
                    <Link to="/driver/login" className="driver-link">
                        Driver Dashboard
                    </Link>
                </div>

                <h1>Local Shuttle ETA</h1>

                <p>
                    A real-time local shuttle ETA system for active buses inside the configured service area.
                </p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Available stops on the local shuttle route</h2>

                    <p>
                        This service provides ETAs only for buses actively operating within the configured local service area.
                    </p>
                </div>

                <select
                    value={selectedStop}
                    onChange={(event) => {
                        setSelectedStop(event.target.value);
                        setResult(initialResult);
                    }}
                    disabled={stopsStatus !== "ready" || isRequesting}
                >
                    <option value="">
                        {stopsStatus === "loading" ? "Loading stops..." : "Select Stop"}
                    </option>
                    {stops.map((stop) => (
                        <option key={stop.name} value={stop.name}>
                            {stop.name}
                        </option>
                    ))}
                </select>

                {stopsStatus === "error" && (
                    <div className="eta-box error">
                        Local stops could not be loaded. Check the backend connection.
                    </div>
                )}

                <div className="btn-group">
                    <button
                        onClick={handleEta}
                        disabled={isRequesting || !selectedStop || !socketConnected || stopsStatus !== "ready"}
                    >
                        {isRequesting ? "Requesting ETA..." : "Get ETA"}
                    </button>
                </div>

                {!socketConnected && (
                    <p className="helper-text">
                        Connecting to the ETA service...
                    </p>
                )}

                {result.type === "loading" && (
                    <div className="loader-container">
                        <div className="loader"></div>
                        <p>{result.message}</p>
                    </div>
                )}

                {result.type === "error" && (
                    <div className="eta-box error">
                        {result.message}
                    </div>
                )}

                {result.type === "success" && (
                    <div className="eta-box success">
                        <p><strong>{result.details.minutes} minutes</strong></p>
                        <p>Bus {result.details.busNumber}</p>
                        <p>Driver: {result.details.driverName}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
