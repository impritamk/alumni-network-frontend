import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("pendingEmail");

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      await axios.post("/api/auth/verify-otp", { email, otp });
      toast.success("Account verified! You can now login.");

      localStorage.removeItem("pendingEmail");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Toaster />
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Verify OTP</h2>
        <p className="mb-3">OTP sent to your email</p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            className="border p-2 w-full rounded"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <button className="bg-blue-600 text-white w-full py-2 rounded">
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
}
