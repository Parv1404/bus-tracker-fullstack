import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://192.168.101.40:8000";

export default function Home() {
  const [hostel, setHostel] = useState("");
  const [eta, setEta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      auth: {
        message: "Student socket",
      },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Student socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Student socket connection error:", error.message);
    });

    socket.on("eta_response", ({ driverName, busNumber, eta }) => {
      setEta(`${Math.round(eta / 60)} mins (Bus ${busNumber} - ${driverName})`);
      setIsLoading(false);
    });

    socket.on("eta_response_error", ({ error }) => {
      setEta(`Error: ${error || "Unable to fetch ETA"}`);
      setIsLoading(false);
    });

    return () => {
      socket.off("eta_response");
      socket.off("eta_response_error");
      socket.disconnect();
    };
  }, []);

  const handleEta = () => {
    if (!socketRef.current) return;

    setEta(null);
    setIsLoading(true);

    socketRef.current.emit("get_eta", {
      hostel,
      requestId: `${hostel}-${Date.now()}`,
    });
  };

  return (
    <div className="container">
      <div className="hero">
        <div className="hero-top">
          <div className="logo-section">
            <img
              src="/hbtu-logo.png"
              alt="HBTU Logo"
              className="hbtu-logo"
            />
            <span>HBTU Kanpur</span>
          </div>

          <Link to="/driver/login" className="driver-link">
            Driver Dashboard
          </Link>
        </div>

        <h1>HBTU Bus Tracking System</h1>

        <p>
          Real-time Bus ETA & Location Tracking
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Track Your Bus</h2>

          <p>
            Select your stop and get the live ETA
          </p>
        </div>

        <select
          value={hostel}
          onChange={(e) => setHostel(e.target.value)}
        >
          <option value="">Select Stop</option>
          <option value="Meerut Central">Meerut Central</option>
          <option value="Bhainsali">Bhainsali</option>
          <option value="Hostel 3">Hostel 3</option>
          <option value="Hostel 4">Hostel 4</option>
        </select>

        <div className="btn-group">
          <button
            onClick={handleEta}
            disabled={isLoading || !hostel}
          >
            {isLoading ? "Fetching..." : "Get ETA"}
          </button>
        </div>

        {isLoading && (
          <div className="loader-container">
            <div className="loader"></div>

            <p>Fetching bus location...</p>
          </div>
        )}

        {eta && (
          <div className="eta-box success">
            🚍 ETA: {eta}
          </div>
        )}
      </div>
    </div>
  );
}