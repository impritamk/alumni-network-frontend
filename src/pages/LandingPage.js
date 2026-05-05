// src/pages/LandingPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = ({ onExploreAsGuest }) => {
  // --- Theme state & toggle for guests ---
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  const toggleDarkMode = () => { 
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark"); 
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light"); 
    }
  };

  return (
    <div className="page-container">
      {/* Navbar for Unauthenticated Users */}
      <div className="landing-nav">
        <div style={{ fontSize: "22px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo-connectalumni.svg" alt="Logo" style={{ width: "40px", height: "40px", filter: isDark ? "invert(1) brightness(2)" : "none" }} />
          <div style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: "-0.5px" }}>
            <span style={{ color: "var(--text-main)" }}>Connect</span>
            <span style={{ color: "var(--primary)" }}>Alumni</span>
          </div>
        </div>
        
        <div className="landing-nav-buttons" style={{ display: "flex", alignItems: "center" }}>
          <button onClick={toggleDarkMode} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", marginRight: "15px" }}>
            <i className={isDark ? "fas fa-sun" : "fas fa-moon"} style={{ color: isDark ? "#fbbf24" : "#64748b" }}></i>
          </button>
          
          <Link to="/login" className="btn-secondary" style={{ marginRight: "10px" }}>Login</Link>
          <Link to="/register" className="btn-primary">Register</Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="landing-hero">
        <h1 className="landing-title">Your Campus. Your Network. Your Future.</h1>
        <p className="landing-subtitle">
          The exclusive networking platform built for the students and alumni of Chaibasa Engineering College to connect, share opportunities, and grow together.
        </p>
        
        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/register" className="btn-primary" style={{ padding: "14px 28px", fontSize: "18px" }}>Join the Network</Link>
          <button onClick={onExploreAsGuest} className="btn-secondary" style={{ padding: "14px 28px", fontSize: "18px" }}>
            <i className="fas fa-eye" style={{ marginRight: "8px" }}></i> Explore as Guest
          </button>
        </div>
      </div>

      {/* Why I Built This */}
      <div className="card" style={{ padding: "40px 30px", marginBottom: "40px", textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>The Mission</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1.8, maxWidth: "800px", margin: "0 auto" }}>
          This platform solves a real problem: keeping our college community connected after graduation. Whether you are a senior offering referrals, a fresher looking for guidance, or a student wanting to explore career paths, this is our secure, dedicated space to collaborate outside of noisy public social media.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid-3" style={{ marginBottom: "40px" }}>
        <div className="card" style={{ textAlign: "center", padding: "30px 20px" }}>
          <i className="fas fa-comments feature-icon"></i>
          <h3>Real-Time Messaging</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>Chat instantly with peers using our secure WebSocket infrastructure. No refreshing required.</p>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "30px 20px" }}>
          <i className="fas fa-briefcase feature-icon"></i>
          <h3>Exclusive Job Board</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>Find internships and full-time roles posted directly by alumni working in the industry.</p>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "30px 20px" }}>
          <i className="fas fa-shield-alt feature-icon"></i>
          <h3>Data Privacy</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>Your data stays within our network. Strict backend JWT verification and role-based access keeps the community safe.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
