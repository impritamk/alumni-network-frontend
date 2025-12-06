import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const email = localStorage.getItem("pendingEmail"); // user email from register

  if (!email) {
    return <p className="p-6 text-center text-red-600">No email found. Please register again.</p>;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/auth/verify-otp", { email, otp });
      toast.success("Email verified! You can now login.");
      localStorage.removeItem("pendingEmail");
      window.location.href = "/login";
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    }
  };

  const resendOtp = async () => {
    try {
      await axios.post("/api/auth/resend-otp", { email });
      toast.success("OTP resent to your email");
    } catch (error) {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Toaster />
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Verify Your Email</h2>
        <p className="text-gray-600 text-center mb-4">
          Enter the OTP sent to <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter 6-digit OTP"
            required
          />

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Verify OTP
          </button>
        </form>

        <button
          onClick={resendOtp}
          className="w-full mt-4 text-blue-600 font-medium underline"
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
}
