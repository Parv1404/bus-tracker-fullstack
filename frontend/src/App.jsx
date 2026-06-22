import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import DriverLogin from "./pages/DriverLogin";
import DriverSignup from "./pages/DriverSignup";
import DriverLocation from "./pages/DriverLocation";

import "./styles/global.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/driver/login" element={<DriverLogin />} />
                <Route path="/driver/signup" element={<DriverSignup />} />
                <Route path="/driver/location" element={<DriverLocation />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
