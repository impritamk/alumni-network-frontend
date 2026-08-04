// src/pages/LoginPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../App"; // Imports your auth logic from App.js

const LoginPage = () => {
  const { login } = useAuth(); 
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [isLoading, setIsLoading] = useState(false); 
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => { 
    e.preventDefault(); 
    setIsLoading(true); 
    try { 
      await login(email, password); 
      toast.success("Login successful!"); 
      navigate("/");
    } catch (err) { 
      toast.error(err.response?.data?.message || "Login failed"); 
      setIsLoading(false); 
    } 
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setIsGuestLoading(true);
    try {
      await login("alumninetworkplatform@gmail.com", "Guest123!");
      toast.success("Welcome, Guest!");
      navigate("/"); 
    } catch (err) {
      toast.error("Guest login failed.");
      setIsGuestLoading(false); 
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Login</h2>
        <form onSubmit={submit}>
          <label>Email</label>
          <input 
            className="input-box" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={isLoading || isGuestLoading} 
          />
          
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input 
              className="input-box" 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={isLoading || isGuestLoading} 
              style={{ paddingRight: '40px' }} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
            </button>
          </div>
          
          <button 
            className="btn-primary" 
            style={{ width: "100%", marginTop: "10px" }} 
            disabled={isLoading || isGuestLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          
          {/* --- GUEST LOGIN BUTTON --- */}
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ width: "100%", marginTop: "10px" }} 
            disabled={isLoading || isGuestLoading}
            onClick={handleGuestLogin}
          >
            {isGuestLoading ? (
              <><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Logging in...</>
            ) : (
              <><i className="fas fa-user-secret" style={{ marginRight: "8px" }}></i> Login as Guest</>
            )}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 15, color: "var(--text-muted)" }}>
          Don't have an account? <Link to="/register" className="text-blue">Register</Link> {" | "} <Link to="/forgot-password" className="text-blue">Forgot Password?</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
