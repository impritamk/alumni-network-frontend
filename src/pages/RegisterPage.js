// src/pages/RegisterPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../App"; // Connects back to your auth logic

const RegisterPage = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ 
    email: "", password: "", confirmPassword: "", firstName: "", lastName: "", 
    collegeName: "Chaibasa Engineering College", passoutYear: new Date().getFullYear() 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); 
    if (form.password !== form.confirmPassword) { toast.error("Passwords mismatch!"); return; }
    
    setIsSubmitting(true); 
    
    try { 
      await register(form); 
      localStorage.setItem("pendingEmail", form.email.toLowerCase().trim()); 
      toast.success("OTP sent!"); 
      window.location.href = "/verify-otp"; 
    } catch (err) { 
      toast.error(err.response?.data?.message || "Registration failed"); 
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 500 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Create Account</h2>
        <form onSubmit={submit}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><label>First Name</label><input className="input-box" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required disabled={isSubmitting} /></div>
            <div style={{ flex: 1 }}><label>Last Name</label><input className="input-box" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required disabled={isSubmitting} /></div>
          </div>
          
          <label>Email</label>
          <input className="input-box" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={isSubmitting} />
          
          <label>College Name</label>
          <input className="input-box" type="text" value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} required disabled={isSubmitting} />
          
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input-box" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required disabled={isSubmitting} style={{ paddingRight: '40px' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} disabled={isSubmitting}>
              <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
            </button>
          </div>
          
          <label>Confirm Password</label>
          <input className="input-box" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required disabled={isSubmitting} />
          
          <label>Passout Year</label>
          <input className="input-box" type="number" value={form.passoutYear} onChange={(e) => setForm({ ...form, passoutYear: e.target.value })} required disabled={isSubmitting} />
          
          <button className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={isSubmitting}>
            {isSubmitting ? (
              <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Sending OTP...</>
            ) : (
              "Register"
            )}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 15, color: "var(--text-muted)" }}>
          Already have an account? <Link to="/login" className="text-blue">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
