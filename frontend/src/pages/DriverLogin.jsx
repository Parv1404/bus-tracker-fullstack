import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { BACKEND_URL, DRIVER_PROFILE_KEY, DRIVER_TOKEN_KEY } from "../config";

export default function DriverLogin() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        busNumber: "",
        password: "",
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

        try {
            setIsSubmitting(true);

            const response = await fetch(`${BACKEND_URL}/driver/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    busNumber: formData.busNumber.trim(),
                    password: formData.password,
                }),
            });

            const responseData = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(responseData?.message || "Invalid bus number or password");
            }

            localStorage.setItem(DRIVER_TOKEN_KEY, responseData.token);
            localStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(responseData.driver));

            navigate("/driver/location", { replace: true });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container auth-page">
            <section className="hero compact-hero">
                <h1>Driver Login</h1>
            </section>

            <section className="card auth-card">
                <h2>Welcome Back</h2>

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

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    {error && <p className="form-error">{error}</p>}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-switch">
                    New driver? <Link to="/driver/signup">Create an account</Link>
                </p>
            </section>
        </div>
    );
}
