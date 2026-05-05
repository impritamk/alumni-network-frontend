// src/pages/ResetPasswordPage.js
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const ResetPasswordPage = () => {
  const { token } = useParams(); const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState(false); const [showPassword, setShowPassword] = useState(false); const navigate = useNavigate();
  const submit = async (e) => { e.preventDefault(); if (password !== confirmPassword) { toast.error("Passwords do not match!"); return; } setLoading(true); try { await axios.post("/api/auth/reset-password", { token, password }); setSuccess(true); toast.success("Password reset successfully!"); setTimeout(() => navigate("/login"), 2000); } catch (err) { toast.error("Failed to reset password"); setLoading(false); } };
  if (success) return <div className="page-container" style={{ maxWidth: 450 }}><Toaster /><div className="card" style={{ marginTop: 60 }}><h2 className="heading" style={{ textAlign: "center", color: "#15803d" }}>✅ Success!</h2><p style={{ textAlign: "center", color: "var(--text-muted)" }}>Redirecting to login...</p></div></div>;
  
  return (
    <div className="page-container" style={{ maxWidth: 450 }}><Toaster />
      <div className="card" style={{ marginTop: 60 }}><h2 className="heading" style={{ textAlign: "center" }}>Reset Password</h2>
        <form onSubmit={submit}>
          <label>New Password</label><div style={{ position: 'relative' }}><input className="input-box" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} style={{ paddingRight: '40px' }} /><button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i></button></div>
          <label>Confirm Password</label><div style={{ position: 'relative' }}><input className="input-box" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} style={{ paddingRight: '40px' }} /></div>
          <button className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
