import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { BACKEND_URL } from "../config";

export default function DriverSignup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        busNumber: "",
        driverName: "",
        phoneNumber: "",
        busIdentifier: "",
        password: "",
        confirmPassword: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const payload = {
            busNumber: formData.busNumber.trim(),
            driverName: formData.driverName.trim(),
            phoneNumber: formData.phoneNumber.trim(),
            busIdentifier: formData.busIdentifier.trim(),
            password: formData.password,
        };

        try {
            setIsSubmitting(true);

            const response = await fetch(`${BACKEND_URL}/driver/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(responseData?.message || responseData?.error || "Error registering driver");
            }

            alert("Driver registered successfully! Please log in.");

            navigate("/driver/login", { replace: true });
        } catch (err) {
            setError(err.message || "An error occurred while registering the driver");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container auth-page">
            <section className="hero compact-hero">
                <h1>Driver Signup</h1>
            </section>

            <section className="card auth-card">
                <h2>Create Account</h2>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="busNumber">Bus Number</label>
                    <input
                        id="busNumber"
                        name="busNumber"
                        type="text"
                        placeholder="Enter bus number"
                        value={formData.busNumber}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="driverName">Driver Name</label>
                    <input
                        id="driverName"
                        name="driverName"
                        type="text"
                        placeholder="Enter driver name"
                        value={formData.driverName}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder="Enter phone number"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="busIdentifier">Bus Identifier</label>
                    <input
                        id="busIdentifier"
                        name="busIdentifier"
                        type="text"
                        placeholder="Optional vehicle identifier"
                        value={formData.busIdentifier}
                        onChange={handleChange}
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Create password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    {error && <p className="form-error">{error}</p>}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Signing up..." : "Signup"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already registered? <Link to="/driver/login">Login now</Link>
                </p>
            </section>
        </div>
    );
}
