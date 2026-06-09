import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Link, useLocation, useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://192.168.101.40:8000";

export default function DriverLocation() {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef(null);

  const [driver] = useState(() => {
    try {
      console.log(JSON.parse(localStorage.getItem("driverProfile")) || location.state?.driver || null);
      return JSON.parse(localStorage.getItem("driverProfile")) || location.state?.driver || null;
    } catch {
      return null;
    }
  });

  const [status, setStatus] = useState("Connecting...");
  // const [sharedLocation, setSharedLocation] = useState(null);

  useEffect(() => {
    if (!driver?.busNumber) return;

    const socket = io(BACKEND_URL, {
      auth: { message: "Driver socket", busNumber: driver.busNumber }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus(`Active — Bus ${driver.busNumber}`);
    });

    socket.on("connect_error", () => setStatus("Connection failed."));

    socket.on("request_driver_location", ({ requestId }) => {
      console.log("Received location request:", requestId);
      if (!navigator.geolocation) {
        socket.emit("driver_location_response", {
          requestId,
          driverName: driver.driverName,
          busNumber: driver.busNumber,
          locationError: "Geolocation not supported by this browser",
        });
        return;
      } 

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const currentLocation = {
            latitude: coords.latitude,
            longitude: coords.longitude,
          };

          // setSharedLocation(currentLocation);
          // setStatus("Location sent for ETA request.");

          socket.emit("driver_location_response", {
            requestId,
            driverName: driver.driverName,
            busNumber: driver.busNumber,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            accuracy: currentLocation.accuracy,
          });
        },
        (err) => {
          socket.emit("driver_location_response", {
            requestId,
            driverName: driver.driverName,
            busNumber: driver.busNumber,
            locationError: err.message || "Failed to get location",
          });
        },
        { enableHighAccuracy: true}
      );
    });
    return () => socket.disconnect();
  }, [driver]);

  if (!driver) {
    return (
      <div className="container">
        <p>No active session.</p>
        <button onClick={() => navigate("/driver/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="container auth-page location-page">
      <section className="hero">
        <h1>Driver Dashboard</h1>
        <p>Share your live location with the tracking system.</p>
      </section>

      <section className="card auth-card location-card">
        <p><strong>{driver.driverName}</strong> — Bus {driver.busNumber}</p>
        <p className="location-status">{status}</p>

        {/* <button className="location-button" onClick={handleShareLocation}>
          Share My Location
        </button> */}

        {/* {sharedLocation && (
          <div className="eta-box location-meta">
            <p><strong>Lat:</strong> {sharedLocation.latitude}</p>
            <p><strong>Lng:</strong> {sharedLocation.longitude}</p>
            <p><strong>Accuracy:</strong> {sharedLocation.accuracy} m</p>
          </div>
        )} */}

        <p className="auth-switch">
          Switch account? <Link to="/driver/login">Logout</Link>
        </p>
      </section>
    </div>
  );
}