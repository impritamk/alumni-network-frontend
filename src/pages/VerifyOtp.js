// src/pages/VerifyOtp.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const VerifyOtp = () => {
  const [otp, setOtp] = useState(""); 
  const [resending, setResending] = useState(false); 
  const [canResend, setCanResend] = useState(true); 
  const [countdown, setCountdown] = useState(0); 
  const navigate = useNavigate();

  useEffect(() => { 
    if (countdown > 0) { 
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000); 
      return () => clearTimeout(timer); 
    } else { 
      setCanResend(true); 
    } 
  }, [countdown]);

  const submit = async (e) => { 
    e.preventDefault(); 
    try { 
      const email = localStorage.getItem("pendingEmail"); 
      if (!email) { toast.error("Email not found."); navigate("/register"); return; } 
      await axios.post("/api/auth/verify-otp", { email, otp }); 
      localStorage.removeItem("pendingEmail"); 
      toast.success("Email verified! Please login."); 
      navigate("/login"); 
    } catch (err) { toast.error(err.response?.data?.message || "Invalid OTP"); } 
  };

  const handleResendOtp = async () => { 
    if (!canResend || resending) return; 
    setResending(true); 
    try { 
      const email = localStorage.getItem("pendingEmail"); 
      if (!email) { toast.error("Email not found."); navigate("/register"); return; } 
      await axios.post("/api/auth/resend-otp", { email }); 
      toast.success("New OTP sent!"); 
      setCanResend(false); setCountdown(60); setOtp(""); 
    } catch (err) { toast.error("Failed to resend OTP"); } 
    finally { setResending(false); } 
  };

  const email = localStorage.getItem("pendingEmail");

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Verify Email</h2>
        {email && <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 20, background: "var(--bg-color)", padding: "10px", borderRadius: "8px" }}>OTP sent to: <strong>{email}</strong></p>}
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 20 }}>Enter the 6-digit OTP sent to your email</p>
        <form onSubmit={submit}>
          <label>OTP Code</label>
          <input className="input-box" type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required maxLength={6} placeholder="123456" style={{ textAlign: "center", fontSize: "24px", letterSpacing: "8px", fontWeight: "bold" }} />
          <button className="btn-primary" style={{ width: "100%", marginTop: 15 }}>Verify Email</button>
        </form>
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border-color)", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: 10 }}>Didn't receive the OTP?</p>
          <button onClick={handleResendOtp} disabled={!canResend || resending} className="btn-secondary">
            {resending ? "Sending..." : countdown > 0 ? `Resend OTP (${countdown}s)` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
