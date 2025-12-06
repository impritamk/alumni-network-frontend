import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    passoutYear: new Date().getFullYear(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/auth/register", formData);

      localStorage.setItem("pendingEmail", formData.email);

      toast.success("OTP sent! Check your email.");
      window.location.href = "/verify-otp";
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <label>First Name</label>
          <input
            className="input-box"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />

          <label>Last Name</label>
          <input
            className="input-box"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />

          <label>Email</label>
          <input
            type="email"
            className="input-box"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />

          <label>Password</label>
          <input
            type="password"
            className="input-box"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />

          <label>Passout Year</label>
          <input
            type="number"
            className="input-box"
            value={formData.passoutYear}
            onChange={(e) =>
              setFormData({ ...formData, passoutYear: e.target.value })
            }
            required
          />

          <button className="btn-primary">Register</button>
        </form>
      </div>
    </div>
  );
}
