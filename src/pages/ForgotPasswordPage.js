// src/pages/ForgotPasswordPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState(""); const [submitted, setSubmitted] = useState(false); const [loading, setLoading] = useState(false); const navigate = useNavigate();
  const submit = async (e) => { e.preventDefault(); setLoading(true); try { await axios.post("/api/auth/forgot-password", { email }); setSubmitted(true); toast.success("Reset link sent!"); } catch (err) { toast.error("Failed to send reset link"); setLoading(false); } };
  if (submitted) return <div className="page-container" style={{ maxWidth: 450 }}><Toaster /><div className="card" style={{ marginTop: 60 }}><h2 className="heading" style={{ textAlign: "center" }}>Check Your Email</h2><p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: 20 }}>We've sent a password reset link to:<br/><strong>{email}</strong></p><button className="btn-primary" onClick={() => navigate("/login")} style={{ width: "100%", marginTop: 20 }}>Back to Login</button></div></div>;
  
  return (
    <div className="page-container" style={{ maxWidth: 450 }}><Toaster />
      <div className="card" style={{ marginTop: 60 }}><h2 className="heading" style={{ textAlign: "center" }}>Forgot Password?</h2>
        <form onSubmit={submit}><label>Email</label><input className="input-box" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} placeholder="your@email.com" /><button className="btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</button></form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
