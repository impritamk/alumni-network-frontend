import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const email = localStorage.getItem("pendingEmail");

  if (!email) {
    window.location.href = "/register";
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/auth/verify-otp", { email, otp });

      toast.success("Email verified! You can now log in.");
      localStorage.removeItem("pendingEmail");

      window.location.href = "/login";
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    }
  };

  const resendOtp = async () => {
    try {
      await axios.post("/api/auth/resend-otp", { email });
      toast.success("OTP resent!");
    } catch (err) {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2>Email Verification</h2>
        <p style={{ marginBottom: 10 }}>
          Enter the OTP sent to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            className="input-box"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <button className="btn-primary" style={{ marginTop: 10 }}>
            Verify OTP
          </button>
        </form>

        <button
          className="btn-secondary"
          onClick={resendOtp}
          style={{ marginTop: 15 }}
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
}
