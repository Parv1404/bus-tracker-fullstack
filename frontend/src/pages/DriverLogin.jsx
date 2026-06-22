import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function DriverLogin() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        driverName: "",
        password: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setIsSubmitting(true);

            const response = await fetch("https://trembling-district-cardstock.ngrok-free.dev/driver/login", {
                method: "POST",   // http://192.168.101.40:8000/driver/login
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const responseData = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(responseData?.message || "Invalid credentials");
            }

            if (responseData?.driver) {
                localStorage.setItem("driverProfile", JSON.stringify(responseData.driver));
            }

            alert("Login successful");
            navigate("/driver/location", { state: { driver: responseData?.driver || null } });
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container auth-page">
            <section className="hero">
                <h1>Driver Login</h1>
            </section>

            <section className="card auth-card">
                <h2>Welcome Back</h2>

                <form className="auth-form" onSubmit={handleSubmit}>
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

                    {error && <p style={{ color: "red" }}>{error}</p>}

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
