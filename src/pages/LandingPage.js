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
    <div className="page-container" style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "60px" }}>
      
      {/* =========================================
          1. NAVBAR 
      ========================================= */}
      <div className="landing-nav" style={{ padding: "15px 0", marginBottom: "40px", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ fontSize: "24px", fontWeight: "800", display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo-connectalumni.svg" alt="Logo" style={{ width: "45px", height: "45px", filter: isDark ? "invert(1) brightness(2)" : "none" }} />
          <div style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: "-0.5px" }}>
            <span style={{ color: "var(--text-main)" }}>Connect</span>
            <span style={{ color: "var(--primary)" }}>Alumni</span>
          </div>
        </div>
        
        <div className="landing-nav-buttons" style={{ display: "flex", alignItems: "center" }}>
          <button onClick={toggleDarkMode} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", marginRight: "20px", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
            <i className={isDark ? "fas fa-sun" : "fas fa-moon"} style={{ color: isDark ? "#fbbf24" : "#64748b" }}></i>
          </button>
          
          <Link to="/login" className="btn-secondary" style={{ marginRight: "10px", padding: "10px 20px" }}>Login</Link>
          <Link to="/register" className="btn-primary" style={{ padding: "10px 20px" }}>Register</Link>
        </div>
      </div>

      {/* =========================================
          2. HERO SECTION (THE "WHAT")
      ========================================= */}
      <div className="landing-hero" style={{ textAlign: "center", padding: "60px 20px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ background: "var(--bg-color)", color: "var(--primary)", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold", marginBottom: "20px", border: "1px solid var(--primary)" }}>
          <i className="fas fa-graduation-cap" style={{ marginRight: "8px" }}></i> 
          Exclusive to Chaibasa Engineering College
        </span>
        <h1 className="landing-title" style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: "1.2", marginBottom: "20px", maxWidth: "800px" }}>
          Your Campus. <span style={{ color: "var(--primary)" }}>Your Network.</span> Your Future.
        </h1>
        <p className="landing-subtitle" style={{ fontSize: "18px", color: "var(--text-muted)", maxWidth: "700px", lineHeight: "1.6", marginBottom: "40px" }}>
          Bridge the gap between graduation and your career. ConnectAlumni is the dedicated networking space for CEC students and alumni to share opportunities, seek mentorship, and grow together.
        </p>
        
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/register" className="btn-primary" style={{ padding: "16px 32px", fontSize: "18px", borderRadius: "8px", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)" }}>
            Join the Network <i className="fas fa-arrow-right" style={{ marginLeft: "8px" }}></i>
          </Link>
          <button onClick={onExploreAsGuest} className="btn-secondary" style={{ padding: "16px 32px", fontSize: "18px", borderRadius: "8px" }}>
            <i className="fas fa-eye" style={{ marginRight: "8px" }}></i> Explore as Guest
          </button>
        </div>
      </div>

      {/* =========================================
          3. THE MISSION (THE "WHY")
      ========================================= */}
      <div className="card" style={{ padding: "50px 40px", marginBottom: "60px", textAlign: "center", borderTop: "4px solid var(--primary)" }}>
        <h2 style={{ marginTop: 0, fontSize: "28px" }}>Why We Built ConnectAlumni</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "17px", lineHeight: 1.8, maxWidth: "900px", margin: "20px auto 0" }}>
          Public social media is noisy. Standard job boards are crowded. We realized that the strongest career opportunities and the most honest advice come from people who walked the same campus halls as you. 
          <br /><br />
          Whether you are a senior offering referrals, a fresher navigating your first interview, or a student looking for roadmap guidance—this is our secure, focused, and dedicated space to collaborate without distractions.
        </p>
      </div>

      {/* =========================================
          4. HOW IT WORKS (THE "HOW")
      ========================================= */}
      <div style={{ marginBottom: "80px" }}>
        <h2 style={{ textAlign: "center", fontSize: "32px", marginBottom: "40px" }}>How It Works</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "30px", justifyContent: "center" }}>
          
          <div style={{ flex: "1 1 250px", textAlign: "center" }}>
            <div style={{ width: "70px", height: "70px", background: "var(--bg-color)", border: "2px solid var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "var(--primary)", margin: "0 auto 20px", fontWeight: "bold" }}>1</div>
            <h3>Verify Identity</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>Sign up with your college details and verify your email to ensure our community remains exclusive and secure.</p>
          </div>

          <div style={{ flex: "1 1 250px", textAlign: "center" }}>
            <div style={{ width: "70px", height: "70px", background: "var(--bg-color)", border: "2px solid var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "var(--primary)", margin: "0 auto 20px", fontWeight: "bold" }}>2</div>
            <h3>Build Your Profile</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>Add your current role, company, skills, and networking goals so peers know how to collaborate with you.</p>
          </div>

          <div style={{ flex: "1 1 250px", textAlign: "center" }}>
            <div style={{ width: "70px", height: "70px", background: "var(--bg-color)", border: "2px solid var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "var(--primary)", margin: "0 auto 20px", fontWeight: "bold" }}>3</div>
            <h3>Connect & Grow</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>Discover batchmates, send connection requests, chat in real-time, and apply for exclusive alumni referrals.</p>
          </div>

        </div>
      </div>

      {/* =========================================
          5. FEATURES GRID (THE "FEATURES")
      ========================================= */}
      <h2 style={{ textAlign: "center", fontSize: "32px", marginBottom: "40px" }}>Everything You Need to Succeed</h2>
      <div className="grid-3" style={{ marginBottom: "60px" }}>
        
        <div className="card" style={{ padding: "35px 25px", transition: "transform 0.3s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <i className="fas fa-address-book feature-icon" style={{ fontSize: "36px", color: "var(--primary)", marginBottom: "20px" }}></i>
          <h3 style={{ marginTop: 0 }}>Smart Directory</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>Search for alumni by name, passout year, branch, or company. Finding a senior at your dream company has never been easier.</p>
        </div>

        <div className="card" style={{ padding: "35px 25px", transition: "transform 0.3s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <i className="fas fa-comments feature-icon" style={{ fontSize: "36px", color: "#10b981", marginBottom: "20px" }}></i>
          <h3 style={{ marginTop: 0 }}>Real-Time Messaging</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>Skip cold emails. Chat directly with peers and mentors using our live WebSocket messaging interface.</p>
        </div>

        <div className="card" style={{ padding: "35px 25px", transition: "transform 0.3s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <i className="fas fa-briefcase feature-icon" style={{ fontSize: "36px", color: "#8b5cf6", marginBottom: "20px" }}></i>
          <h3 style={{ marginTop: 0 }}>Exclusive Job Board</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>Access hidden internship and full-time opportunities posted directly by alumni hiring for their teams.</p>
        </div>

        <div className="card" style={{ padding: "35px 25px", transition: "transform 0.3s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <i className="fas fa-newspaper feature-icon" style={{ fontSize: "36px", color: "#f59e0b", marginBottom: "20px" }}></i>
          <h3 style={{ marginTop: 0 }}>Community Feed</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>Share achievements, ask career questions, or post helpful resources. Engage with likes and comments just like LinkedIn.</p>
        </div>

        <div className="card" style={{ padding: "35px 25px", transition: "transform 0.3s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <i className="fas fa-hands-helping feature-icon" style={{ fontSize: "36px", color: "#ef4444", marginBottom: "20px" }}></i>
          <h3 style={{ marginTop: 0 }}>Goal-Oriented Networking</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>Profile tags show exactly what people are open to: whether they are seeking opportunities or offering referrals.</p>
        </div>

        <div className="card" style={{ padding: "35px 25px", transition: "transform 0.3s", cursor: "default" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-5px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <i className="fas fa-shield-alt feature-icon" style={{ fontSize: "36px", color: "#3b82f6", marginBottom: "20px" }}></i>
          <h3 style={{ marginTop: 0 }}>Verified & Secure</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>Strict backend JWT authentication and OTP verification ensures that your data stays within the trusted college community.</p>
        </div>

      </div>

      {/* =========================================
          6. BOTTOM CTA & FOOTER
      ========================================= */}
      <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--card-bg)", borderRadius: "16px", border: "1px solid var(--border-color)", marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 15px 0", fontSize: "32px" }}>Ready to unlock your network?</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "18px", marginBottom: "30px" }}>Join hundreds of CEC students and alumni already building the future.</p>
        <Link to="/register" className="btn-primary" style={{ padding: "14px 40px", fontSize: "18px", borderRadius: "8px" }}>Create Your Free Account</Link>
      </div>

      <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "14px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
        <p>© {new Date().getFullYear()} ConnectAlumni. Built for Chaibasa Engineering College.</p>
      </div>

    </div>
  );
};

export default LandingPage;
