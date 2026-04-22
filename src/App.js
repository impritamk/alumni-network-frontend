import "./styles.css";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";
import Microlink from '@microlink/react';

// ==============================
// AXIOS CONFIG & INTERCEPTOR
// ==============================
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
axios.defaults.baseURL = API_URL;

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend says the token is expired/invalid, log them out instantly
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      // Only redirect if they aren't already on the login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

// ==============================
// AUTH CONTEXT
// ==============================
const AuthContext = React.createContext();
export const useAuth = () => React.useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { 
    const token = localStorage.getItem("token"); 
    if (token) { 
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; 
      fetchUser(); 
    } else { 
      setLoading(false); 
    } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchUser = async () => { 
    try { 
      const res = await axios.get("/api/auth/me"); 
      setUser(res.data.user); 
    } catch (err) { 
      localStorage.removeItem("token"); 
      delete axios.defaults.headers.common["Authorization"]; 
    } finally { 
      setLoading(false); 
    } 
  };
  
  const login = async (email, password) => { 
    const res = await axios.post("/api/auth/login", { email, password }); 
    localStorage.setItem("token", res.data.token); 
    axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`; 
    setUser(res.data.user); 
    return res.data.user; 
  };
  
  const register = async (formData) => { 
    const res = await axios.post("/api/auth/register", formData); 
    return res.data; 
  };
  
  const logout = () => { 
    localStorage.removeItem("token"); 
    delete axios.defaults.headers.common["Authorization"]; 
    setUser(null); 
  };
  
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==============================
// NAVBAR WITH SLEEK DRAWER
// ==============================
const Navbar = () => {
  const { user, logout } = useAuth(); 
  const navigate = useNavigate(); 
  const [menuOpen, setMenuOpen] = useState(false);
  const [indicators, setIndicators] = useState({ hasNewJobs: false, hasUnreadMessages: false });
  // 1. Check local storage FIRST when the component loads
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDarkMode = savedTheme === "dark";
    // Apply the class immediately if they prefer dark mode
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    }
    return isDarkMode;
  }); 
  
  useEffect(() => { 
    if (user) { 
      const fetchInd = async () => { 
        try { 
          const res = await axios.get("/api/user/indicators"); 
          setIndicators(res.data); 
        } catch (err) { } 
      }; 
      fetchInd(); 
      const int = setInterval(fetchInd, 60000); 
      return () => clearInterval(int); 
    } 
  }, [user]);
  
  const doLogout = () => { 
    logout(); 
    navigate("/login"); 
  };

  // 2. Update the toggle function to save their choice to long-term memory
  const toggleDarkMode = () => { 
    const newMode = !isDark;
    setIsDark(newMode);
    
    if (newMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark"); // Save to memory
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light"); // Save to memory
    }
  };

  const Dot = () => (
    <span style={{ position: "absolute", top: "-5px", right: "-10px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 0 2px var(--card-bg)" }}></span>
  );

  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 30px", margin: "12px 16px", borderRadius: "12px", borderBottom: "none", minHeight: "60px", position: "relative" }}>
      <Link to="/" style={{ textDecoration: "none", fontSize: "22px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo-connectalumni.svg" alt="Logo" style={{ width: "40px", height: "40px", filter: isDark ? "invert(1) brightness(2)" : "none", transition: "filter 0.3s ease" }} />
        <div style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: "-0.5px" }}>
          <span style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Connect</span>
          <span style={{ color: "#2563eb" }}>Alumni</span>
        </div>
      </Link>
      
      <div className="navbar-desktop-menu">
        <Link to="/" className="nav-link">Feed</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/alumni" className="nav-link">Alumni</Link>
        <Link to="/connections" className="nav-link">Connections</Link>
        
        <Link to="/messages" onClick={() => setIndicators(prev => ({...prev, hasUnreadMessages: false}))} className="nav-link" style={{position:'relative'}}>
          Messages {indicators.hasUnreadMessages && <Dot />}
        </Link>

        <Link to="/jobs" onClick={() => setIndicators(prev => ({...prev, hasNewJobs: false}))} className="nav-link" style={{position:'relative'}}>
          Jobs {indicators.hasNewJobs && <Dot />}
        </Link>
        
        {user?.role === 'admin' && (
          <Link to="/admin" style={{ color: "#ef4444", fontWeight: "700", fontSize: "14px", transition: "color 0.3s" }}>Admin Panel</Link>
        )}

        <Link to="/profile/edit" className="nav-link">Profile</Link>
        
        <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>
          Hi, {user?.first_name || "User"}
        </span>

        <button onClick={toggleDarkMode} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "5px" }}>
          <i className={isDark ? "fas fa-sun" : "fas fa-moon"} style={{ color: isDark ? "#fbbf24" : "#64748b" }}></i>
        </button>

        <button onClick={doLogout} className="btn-primary" style={{ padding: "8px 16px" }}>Logout</button>
      </div>

      <button className="navbar-hamburger-btn" onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--primary)", position: "relative" }}>
        <i className="fas fa-bars"></i>
        {(indicators.hasNewJobs || indicators.hasUnreadMessages) && <Dot />}
      </button>

      {menuOpen && <div className="drawer-overlay" onClick={() => setMenuOpen(false)}></div>}
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => setMenuOpen(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <i className="fas fa-times"></i>
        </button>
        <Link to="/" className="drawer-link" onClick={() => setMenuOpen(false)}>Feed</Link>
        <Link to="/dashboard" className="drawer-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link to="/alumni" className="drawer-link" onClick={() => setMenuOpen(false)}>Alumni Directory</Link>
        <Link to="/connections" className="drawer-link" onClick={() => setMenuOpen(false)}>Connections</Link>
        <Link to="/messages" className="drawer-link" onClick={() => { setMenuOpen(false); setIndicators(prev => ({...prev, hasUnreadMessages: false})); }}>Messages {indicators.hasUnreadMessages && "🔴"}</Link>
        <Link to="/jobs" className="drawer-link" onClick={() => { setMenuOpen(false); setIndicators(prev => ({...prev, hasNewJobs: false})); }}>Jobs {indicators.hasNewJobs && "🔴"}</Link>
        {user?.role === 'admin' && <Link to="/admin" className="drawer-link" onClick={() => setMenuOpen(false)} style={{ color: '#ef4444', fontWeight: 'bold' }}>Admin Panel</Link>}
        <Link to="/profile/edit" className="drawer-link" onClick={() => setMenuOpen(false)}>Edit Profile</Link>
        <button onClick={toggleDarkMode} style={{ background: "none", border: "none", color: "var(--text-muted)", textAlign: "left", padding: "10px 0", fontSize: '18px', cursor: "pointer" }}>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
        <button onClick={doLogout} className="btn-danger" style={{ marginTop: '20px' }}>Logout</button>
      </div>
    </div>
  );
};

// ==============================
// ROUTE WRAPPERS
// ==============================
const PrivateRoute = ({ children }) => { 
  const { user, loading } = useAuth(); 
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px', color: 'var(--text-muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ color: "var(--primary)", marginRight: "10px" }}></i> Loading...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />; 
};

const PrivateLayout = ({ children }) => { 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="app-content" style={{ flex: 1 }}>{children}</div>
    </div>
  ); 
};

// ==============================
// GLOBAL LOADING SKELETON
// ==============================
const PageSkeleton = () => {
  return (
    <div className="page-container">
      {/* Search/Header Skeleton */}
      <div className="card" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="skeleton skeleton-title" style={{ width: "30%", height: "30px", margin: 0 }}></div>
        <div className="skeleton" style={{ width: "100px", height: "35px", borderRadius: "6px" }}></div>
      </div>
      
      {/* Grid of Skeleton Cards */}
      <div className="grid-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="skeleton skeleton-title" style={{ width: "60%" }}></div>
            <div className="skeleton skeleton-text" style={{ width: "40%" }}></div>
            <div className="skeleton skeleton-text" style={{ marginTop: "10px", height: "10px" }}></div>
            <div className="skeleton skeleton-text" style={{ height: "10px" }}></div>
            <div className="skeleton" style={{ width: "100px", height: "30px", marginTop: "10px", borderRadius: "6px" }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==============================
// PUBLIC LANDING PAGE
// ==============================
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

// ==============================
// AUTH PAGES (LOGIN / REGISTER / OTP)
// ==============================
const LoginPage = () => {
  const { login } = useAuth(); 
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [isLoading, setIsLoading] = useState(false); 
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

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Login</h2>
        <form onSubmit={submit}>
          <label>Email</label>
          <input className="input-box" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
          
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input-box" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} style={{ paddingRight: '40px' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
            </button>
          </div>
          
          <button className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
          
            {/* --- NEW GUEST LOGIN BUTTON --- */}
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ width: "100%", marginTop: "10px" }} 
              disabled={isLoading}
              onClick={async (e) => {
                e.preventDefault();
                setIsLoading(true); // <-- This instantly disables the buttons and shows loading
                try {
                  await login("alumninetworkplatform@gmail.com", "Guest123!");
                  toast.success("Welcome, Guest!");
                  navigate("/"); // Instant transition!
                } catch (err) {
                  toast.error("Guest login failed.");
                  setIsLoading(false); // Re-enable buttons if it fails
                }
              }}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> Logging in...</>
              ) : (
                <><i className="fas fa-user-secret" style={{ marginRight: "8px" }}></i> Login as Guest</>
              )}
            </button>
            {/* ------------------------------ */}
        </form>
        <p style={{ textAlign: "center", marginTop: 15, color: "var(--text-muted)" }}>
          Don't have an account? <Link to="/register" className="text-blue">Register</Link> {" | "} <Link to="/forgot-password" className="text-blue">Forgot Password?</Link>
        </p>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ 
    email: "", password: "", confirmPassword: "", firstName: "", lastName: "", 
    collegeName: "Chaibasa Engineering College", passoutYear: new Date().getFullYear() 
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // --- NEW: Loading state for the submit button ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); 
    if (form.password !== form.confirmPassword) { toast.error("Passwords mismatch!"); return; }
    
    // Instantly disable the button when clicked
    setIsSubmitting(true); 
    
    try { 
      await register(form); 
      localStorage.setItem("pendingEmail", form.email.toLowerCase().trim()); 
      toast.success("OTP sent!"); 
      window.location.href = "/verify-otp"; 
    } catch (err) { 
      toast.error(err.response?.data?.message || "Registration failed"); 
      // Re-enable the button if it fails so they can try again
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
          
          {/* --- NEW: Smart Register Button --- */}
          <button 
            className="btn-primary" 
            style={{ width: "100%", marginTop: "10px" }} 
            disabled={isSubmitting}
          >
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

// ==============================
// CONNECT BUTTON COMPONENT
// ==============================
const ConnectButton = ({ userId }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState("not_connected"); 
  const [loading, setLoading] = useState(true); 
  const navigate = useNavigate();

  useEffect(() => { 
    const checkConnectionStatus = async () => { 
      try { 
        const res = await axios.get(`/api/connections/check/${userId}`); 
        setStatus(res.data.status); 
      } catch (err) { } 
      finally { setLoading(false); } 
    }; 
    checkConnectionStatus(); 
  }, [userId]);

  const handleConnect = async () => {
    // --- 2. ADD THIS CHECK ---
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Guest accounts cannot send connection requests.");
      return;
    }
    // -------------------------
    try { 
      setLoading(true); 
      await axios.post(`/api/connections/${userId}/request`); 
      setStatus("pending"); 
      toast.success("Connection request sent!"); 
    } catch (err) { 
      if (err.response?.status === 409) { toast.error(err.response.data.message); } 
      else { toast.error("Failed to send connection request"); } 
    } finally { setLoading(false); } 
  };

  const handleRemove = async () => { 
    // --- 3. ADD THIS CHECK ---
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Guest accounts cannot modify connections.");
      return;
    }
    // -------------------------
    if (window.confirm("Are you sure you want to remove this connection?")) { 
      try { 
        setLoading(true); 
        await axios.delete(`/api/connections/${userId}`); 
        setStatus("not_connected"); 
        toast.success("Connection removed"); 
      } catch (err) { toast.error("Failed to remove connection"); } 
      finally { setLoading(false); } 
    } 
  };

  const handleMessage = () => { navigate(`/messages?userId=${userId}`); };

  if (loading) return <button className="btn-primary" disabled><i className="fas fa-spinner fa-spin"></i></button>;
  if (status === "accepted") return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="btn-primary" onClick={handleMessage}><i className="fas fa-comment-dots" style={{ marginRight: 5 }}></i> Message</button>
      <button className="btn-danger" onClick={handleRemove}><i className="fas fa-times" style={{ marginRight: 5 }}></i> Disconnect</button>
    </div>
  );
  if (status === "pending") return (
    <button className="btn-cancel" onClick={handleRemove}>
      <i className="fas fa-times" style={{ marginRight: 5 }}></i> Cancel Request
    </button>
  );
  return (
    <button className="btn-primary" onClick={handleConnect}>
      <i className="fas fa-user-plus" style={{ marginRight: 5 }}></i> Connect
    </button>
  );
};

// ==============================
// ALUMNI PROFILE PAGE
// ==============================
const AlumniProfile = () => {
  const { id } = useParams(); 
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  
  // --- NEW: State for user's posts ---
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // --- NEW: Function to fetch posts ---
  const fetchUserPosts = useCallback(async () => {
    try {
      const res = await axios.get(`/api/users/${id}/posts`);
      setUserPosts(res.data.posts);
    } catch (err) {
      console.error("Failed to load user posts");
    } finally {
      setPostsLoading(false);
    }
  }, [id]);

  useEffect(() => { 
    const fetchUser = async () => { 
      setLoading(true); setError(null); 
      try { 
        const res = await axios.get(`/api/users/${id}`); 
        setProfileUser(res.data.user); 
      } catch (err) { 
        setError(err.response?.data?.message || "Failed to load user profile"); 
      } finally { 
        setLoading(false); 
      } 
    }; 
    fetchUser(); 
    fetchUserPosts(); // <-- Call the posts fetcher here
  }, [id, fetchUserPosts]);

  // --- NEW: Function to handle deleting a post from the profile view ---
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete post?")) return; 
    try { 
      await axios.delete(`/api/posts/${postId}`); 
      toast.success("Deleted"); 
      fetchUserPosts(); 
    } catch (err) { toast.error("Failed to delete"); } 
  };

  if (loading) return <PageSkeleton />;
  if (error || !profileUser) return <div className="page-container"><Toaster /><div className="card" style={{ textAlign: "center" }}><h2><i className="fas fa-user-slash" style={{ color: "var(--danger)", marginRight: 10 }}></i>User Not Found</h2><p style={{ color: "var(--text-muted)", marginBottom: 15 }}>{error || "This user profile could not be found."}</p><Link to="/alumni" className="btn-primary" style={{ display: "inline-block" }}>Back to Alumni List</Link></div></div>;
  
  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Toaster />
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              {profileUser.first_name} {profileUser.last_name}
              {profileUser.role === 'admin' && <span className="admin-badge" style={{ marginLeft: "10px" }}>ADMIN</span>}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", marginTop: 5, marginBottom: 10 }}>{profileUser.headline || "Alumni"}</p>
            
            {/* Networking Goals Badge */}
            {profileUser.open_to && (
              <span style={{ display: "inline-block", background: "#f3e8ff", color: "#7c3aed", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", marginBottom: "15px" }}>
                <i className="fas fa-hands-helping" style={{ marginRight: "6px" }}></i> 
                Open To: {profileUser.open_to}
              </span>
            )}
          </div>

          {/* Social Links rendering */}
          <div style={{ display: "flex", gap: "15px" }}>
            {profileUser.linkedin_url && (
              <a href={profileUser.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0077b5", fontSize: "28px", transition: "transform 0.2s" }} title="LinkedIn Profile" onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
                <i className="fab fa-linkedin"></i>
              </a>
            )}
            {profileUser.github_url && (
              <a href={profileUser.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-main)", fontSize: "28px", transition: "transform 0.2s" }} title="GitHub/Portfolio" onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
                <i className="fab fa-github"></i>
              </a>
            )}
          </div>
        </div>
        
        {/* Main Info Grid */}
        <div style={{ marginTop: 10, paddingTop: 20, borderTop: "1px solid var(--border-color)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
          <p style={{ margin: 0 }}><b><i className="fas fa-graduation-cap" style={{ color: "var(--primary)", width: 25 }}></i> Batch:</b> {profileUser.passout_year || "N/A"}</p>
          {profileUser.student_id && <p style={{ margin: 0 }}><b><i className="fas fa-id-card" style={{ color: "var(--primary)", width: 25 }}></i> Student ID:</b> {profileUser.student_id}</p>}
          {profileUser.branch && <p style={{ margin: 0 }}><b><i className="fas fa-code-branch" style={{ color: "var(--primary)", width: 25 }}></i> Branch:</b> {profileUser.branch}</p>}
          <p style={{ margin: 0 }}><b><i className="fas fa-university" style={{ color: "var(--primary)", width: 25 }}></i> College:</b> {profileUser.college_name || "Chaibasa Engineering College"}</p>
          {profileUser.email && <p style={{ margin: 0 }}><b><i className="fas fa-envelope" style={{ color: "var(--primary)", width: 25 }}></i> Email:</b> <a href={`mailto:${profileUser.email}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{profileUser.email}</a></p>}
          {profileUser.mobile_no && <p style={{ margin: 0 }}><b><i className="fas fa-phone" style={{ color: "var(--primary)", width: 25 }}></i> Mobile:</b> {profileUser.mobile_no}</p>}
          {profileUser.company && <p style={{ margin: 0 }}><b><i className="fas fa-building" style={{ color: "var(--primary)", width: 25 }}></i> Company:</b> {profileUser.company}</p>}
          {profileUser.location && <p style={{ margin: 0 }}><b><i className="fas fa-map-marker-alt" style={{ color: "var(--primary)", width: 25 }}></i> Location:</b> {profileUser.location}</p>}
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <div style={{ marginTop: 25, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
            <h3 style={{ marginTop: 0 }}>About</h3>
            <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{profileUser.bio}</p>
          </div>
        )}
        
        {/* Connect Buttons */}
        {currentUser && String(currentUser.id) !== String(id) && (
          <div style={{ marginTop: 25, display: "flex", gap: 10 }}>
            <ConnectButton userId={id} />
          </div>
        )}
      </div>
      
      {/* --- NEW: Recent Posts Section --- */}
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="fas fa-pencil-alt" style={{ color: "var(--primary)" }}></i> 
          Recent Posts by {profileUser.first_name}
        </h3>
        
        {postsLoading ? (
           <p style={{ color: "var(--text-muted)" }}>Loading posts...</p>
        ) : userPosts.length === 0 ? (
           <div className="card" style={{ textAlign: "center", background: "transparent", border: "1px dashed var(--border-color)", boxShadow: "none" }}>
             <p style={{ color: "var(--text-muted)", margin: 0 }}>This user hasn't posted anything yet.</p>
           </div>
        ) : (
           <div style={{ display: "flex", flexDirection: "column" }}>
             {userPosts.map(post => (
               <PostItem 
                 key={post.id} 
                 post={post} 
                 user={currentUser} 
                 onDelete={handleDeletePost} 
                 onRefresh={fetchUserPosts} 
               />
             ))}
           </div>
        )}
      </div>

      <Link to="/alumni" className="text-blue" style={{ display: "inline-block", marginTop: 20, fontSize: "16px", fontWeight: "600" }}>← Back to Directory</Link>
    </div>
  );
};
// ==============================
// COMMUNITY FEED & POSTS
// ==============================
const PostItem = ({ post, user, onDelete, onRefresh, defaultShowComments = false, isSingleView = false }) => {
  const [showComments, setShowComments] = useState(defaultShowComments); 
  const [commentText, setCommentText] = useState(""); 
  const [isLiking, setIsLiking] = useState(false);
  const navigate = useNavigate();
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = post.content.match(urlRegex);
  const firstUrl = urls ? urls[0] : null; 

  // --- NEW: Check if the link is a YouTube video ---
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const ytId = firstUrl ? getYouTubeId(firstUrl) : null;
  // -------------------------------------------------

  const handleLike = async () => { 
    if (isLiking) return; 
    setIsLiking(true); 
    try { 
      await axios.post(`/api/posts/${post.id}/like`); 
      onRefresh(); 
    } catch (err) { toast.error("Failed to like post"); } 
    finally { setIsLiking(false); } 
  };
  
  const handleComment = async (e) => { 
    e.preventDefault(); 
    if (!commentText.trim()) return; 
    try { 
      await axios.post(`/api/posts/${post.id}/comments`, { content: commentText }); 
      setCommentText(""); 
      onRefresh(); 
    } catch (err) { toast.error("Failed to post comment"); } 
  };
  
  const handleDeleteComment = async (commentId) => { 
    if (!window.confirm("Delete this comment?")) return; 
    try { 
      await axios.delete(`/api/posts/comments/${commentId}`); 
      onRefresh(); 
    } catch (err) { toast.error("Failed to delete comment"); } 
  };

  const handleShare = () => {
    const link = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  // NEW: Function to handle clicking the empty space of the card
  const handleCardClick = () => {
    if (!isSingleView) {
      navigate(`/post/${post.id}`);
    }
  };
  
  return (
    <div 
      className="card" 
      onClick={handleCardClick}
      // NEW: Add a pointer cursor if it's clickable
      style={{ marginBottom: "15px", cursor: !isSingleView ? "pointer" : "default", transition: "transform 0.2s" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div 
          className="post-header" 
          // NEW: Stop propagation so clicking the profile doesn't open the post
          onClick={(e) => { e.stopPropagation(); navigate(`/alumni/${post.user_id}`); }}
          style={{ cursor: "pointer", display: "flex", gap: "10px" }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {post.first_name[0]}
          </div>
          <div>
            <h4 style={{ margin: "0 0 2px 0", color: "inherit", display: "flex", alignItems: "center" }}>
              {post.first_name} {post.last_name}
              {post.role === 'admin' && <span className="admin-badge">ADMIN</span>}
            </h4>
            <span className="college-display" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chaibasa Engineering College</span>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
              {new Date(post.created_at).toLocaleDateString('en-GB')} at {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        {(user?.role === 'admin' || user?.id === post.user_id) && (
          // NEW: Stop propagation on delete button
          <button onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} className="btn-danger" style={{ padding: "4px 10px", fontSize: "12px" }}><i className="fas fa-trash"></i></button>
        )}
      </div>
      
      <p style={{ margin: "15px 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{post.content}</p>
      
      {/* --- NEW: Smart Link Rendering --- */}
      {firstUrl && ytId ? (
        // If it's YouTube, render a responsive native video player!
        <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: "15px", borderRadius: "8px", overflow: "hidden", position: "relative", paddingTop: "56.25%", border: "1px solid var(--border-color)" }}>
          <iframe
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
            src={`https://www.youtube.com/embed/${ytId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ) : firstUrl ? (
        // If it's a regular website, use Microlink!
        <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: "15px", overflow: "hidden", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <Microlink url={firstUrl} style={{ width: '100%', border: 'none', borderRadius: '8px' }} size="large" />
        </div>
      ) : null}
      {/* --------------------------------- */}
      
      {/* NEW: Stop propagation on the whole action bar */}
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "15px", borderTop: "1px solid var(--border-color)", paddingTop: "10px", flexWrap: "wrap" }}>
        <button onClick={handleLike} disabled={isLiking} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: post.user_liked ? "var(--danger)" : "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className={post.user_liked ? "fas fa-heart" : "far fa-heart"}></i> {post.like_count || 0} Likes
        </button>
        <button onClick={() => setShowComments(!showComments)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className="far fa-comment"></i> {post.comments?.length || 0} Comments
        </button>
        <button onClick={handleShare} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className="fas fa-share"></i> Share
        </button>
        
      </div>

      {showComments && (
        // NEW: Stop propagation on the comments container
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "15px", background: "var(--bg-color)", padding: "15px", borderRadius: "8px" }}>
          <form onSubmit={handleComment} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input type="text" className="input-box" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ marginBottom: 0, flex: 1 }} />
            <button type="submit" className="btn-primary" disabled={!commentText.trim()}>Post</button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {post.comments && post.comments.length > 0 ? (post.comments.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", background: "var(--card-bg)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <div>
                  <strong 
                    style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "5px", cursor: 'pointer' }}
                    onClick={() => navigate(`/alumni/${c.user_id}`)}
                  >
                    {c.first_name} {c.last_name}
                    {c.role === 'admin' && <span className="admin-badge">ADMIN</span>}
                  </strong>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                    {new Date(c.created_at).toLocaleDateString('en-GB')}
                  </span>
                <p style={{ margin: 0, fontSize: "14px" }}>{c.content}</p>
                </div>
                {(user?.role === 'admin' || user?.id === c.user_id) && <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", alignSelf: "flex-start", padding: "5px" }}><i className="fas fa-times"></i></button>}
              </div>
            ))) : (<p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>No comments yet.</p>)}
          </div>
        </div>
      )}
    </div>
  );
};

const SinglePostPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPost = useCallback(async () => {
    try {
      const res = await axios.get(`/api/posts/${id}`);
      setPost(res.data.post);
    } catch (err) { 
      toast.error("Failed to load post"); 
      navigate("/");
    } finally { 
      setLoading(false); 
    }
  }, [id, navigate]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleDelete = async (postId) => { 
    if (!window.confirm("Delete post?")) return; 
    try { 
      await axios.delete(`/api/posts/${postId}`); 
      toast.success("Deleted"); 
      navigate("/");
    } catch (err) { toast.error("Failed to delete"); } 
  };

  if (loading) return <PageSkeleton />;
  if (!post) return null;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Toaster />
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginBottom: "15px", fontWeight: "bold" }}>
        <i className="fas fa-arrow-left"></i> Back
      </button>
      <PostItem post={post} user={user} onDelete={handleDelete} onRefresh={fetchPost} defaultShowComments={true} isSingleView={true} />
    </div>
  );
};
// ==============================
// CREATE POST MODAL
// ==============================
const CreatePostModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Please register a full account to post on the feed!");
      return;
    }
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await axios.post("/api/posts", { content });
      toast.success("Posted successfully!");
      onSuccess();
    } catch (err) {
      toast.error("Failed to post");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "15px" }}>
      <div className="card" style={{ maxWidth: 600, width: "100%", padding: "25px", position: "relative", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Create a Post</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "var(--text-muted)", lineHeight: "1" }}>×</button>
        </div>

        {/* User Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: 45, height: 45, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: "18px", fontWeight: 'bold' }}>
            {user?.first_name ? user.first_name[0] : "A"}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "16px" }}>{user?.first_name} {user?.last_name}</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Posting to ConnectAlumni</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <textarea
            className="input-box"
            rows="8"
            placeholder="What do you want to talk about? Share an update, ask a question, or post a resource link..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ resize: "none", fontSize: "16px", padding: "15px", lineHeight: "1.5", flex: 1, minHeight: "150px" }}
            autoFocus
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 15 }}>
            <button type="submit" className="btn-primary" disabled={submitting || !content.trim()} style={{ padding: "12px 24px", fontSize: "16px", borderRadius: "24px" }}>
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

const FeedPage = () => {
  const { user } = useAuth(); 
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [sortOption, setSortOption] = useState("latest");
  const [showPostModal, setShowPostModal] = useState(false); // NEW STATE
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;
  
  const fetchPosts = useCallback(async (pageNum = 1, isNewSort = false) => { 
    try { 
      if (pageNum === 1 && isNewSort) setLoading(true);
      
      const res = await axios.get(`/api/posts?sort=${sortOption}&page=${pageNum}&limit=${LIMIT}`); 
      
      if (pageNum === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts(prev => [...prev, ...res.data.posts]);
      }
      
      setHasMore(res.data.posts.length === LIMIT);
    } catch (err) { toast.error("Failed to load posts"); } 
    finally { setLoading(false); } 
  }, [sortOption]);
  
  useEffect(() => { 
    setPage(1);
    fetchPosts(1, true); 
  }, [sortOption, fetchPosts]);
  
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, false);
  };

  const refreshAllLoadedPosts = async () => {
    try {
      const res = await axios.get(`/api/posts?sort=${sortOption}&page=1&limit=${page * LIMIT}`);
      setPosts(res.data.posts);
    } catch (err) { 
      console.error("Failed to silently refresh posts"); 
    }
  };
  
  const handleDelete = async (postId) => { 
    if (!window.confirm("Delete post?")) return; 
    try { 
      await axios.delete(`/api/posts/${postId}`); 
      setPage(1);
      fetchPosts(1, true); 
      toast.success("Deleted"); 
    } catch (err) { toast.error("Failed to delete"); } 
  };

  if (loading) return <PageSkeleton />;
  
  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Toaster />
      
      {/* --- NEW MODAL RENDER --- */}
      {showPostModal && (
        <CreatePostModal 
          onClose={() => setShowPostModal(false)} 
          onSuccess={() => {
            setShowPostModal(false);
            setPage(1);
            fetchPosts(1, true);
          }} 
        />
      )}
      
      {/* Header & Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30, flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>Welcome back, {user?.first_name || "Alumni"}! 👋</h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Here is what's happening in your community today.</p>
        </div>
        
        {/* --- UPDATED BUTTON GROUP --- */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setShowPostModal(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-edit"></i> Create Post
          </button>
          <Link to="/alumni" className="btn-secondary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-search"></i> Alumni
          </Link>
          <Link to="/jobs" className="btn-secondary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fas fa-briefcase"></i> Jobs
          </Link>
        </div>
      </div>
      
      {/* Clean Sort Dropdown */}
      {posts.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
          <select className="input-box" value={sortOption} onChange={(e)=>setSortOption(e.target.value)} style={{ width: '140px', marginBottom: 0, padding: '8px 12px', background: "var(--card-bg)" }}>
            <option value="latest">Latest</option>
            <option value="top">Most Liked</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      )}
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        {posts.map(post => <PostItem key={post.id} post={post} user={user} onDelete={handleDelete} onRefresh={refreshAllLoadedPosts} />)}
        {posts.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No posts yet. Break the ice!</p>}
        
        {hasMore && posts.length > 0 && (
          <button onClick={loadMore} className="btn-secondary" style={{ width: '100%', marginTop: '15px', padding: '12px', fontWeight: 'bold' }}>
            Load More Posts
          </button>
        )}
        {!hasMore && posts.length > 0 && (
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px", fontSize: "14px" }}>You have reached the end of the feed.</p>
        )}
        {/* --- NEW: Back to Top Button --- */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          style={{ 
            marginTop: '30px', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: 'pointer', 
            fontSize: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '5px',
            width: '100%'
          }}
        >
          <i className="fas fa-arrow-up"></i> Back to top
        </button>
      </div>
    </div>
  );
};
// ==============================
// JOB MODALS (CREATE/EDIT, APPLY, VIEW)
// ==============================
const JobFormModal = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isEdit = !!job; 
  // This safely maps the database's apply_link to React's applyLink when editing!
  const [form, setForm] = useState(job ? { ...job, applyLink: job.apply_link || "" } : { title: "", company: "", description: "", requirements: "", location: "", salaryRange: "", jobType: "Full-time", experienceLevel: "Mid-level", applyLink: "" });
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e) => { 
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Please create an account to post or edit jobs!");
      return; 
    } 
    setSubmitting(true); 
    try { 
      if (isEdit) { 
        await axios.put(`/api/jobs/${job.id}`, form); 
        toast.success("Job updated!"); 
      } else { 
        await axios.post("/api/jobs", form); 
        toast.success("Job posted!"); 
      } 
      onSuccess(); 
    } catch (err) { 
      toast.error(err.response?.data?.message || "Failed to save job"); 
      setSubmitting(false); 
    } 
  };
  
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div className="card" style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{isEdit ? "Edit Job" : "Post a Job"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Job Title *</label><input className="input-box" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label>Company *</label><input className="input-box" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          <label>Location</label><input className="input-box" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div style={{display:'flex', gap:10}}>
            <div style={{flex:1}}>
              <label>Job Type</label>
              <select className="input-box" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} required>
                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
              </select>
            </div>
            <div style={{flex:1}}>
              <label>Level</label>
              <select className="input-box" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} required>
                <option>Entry-level</option><option>Mid-level</option><option>Senior</option><option>Lead</option>
              </select>
            </div>
          </div>
          <label>Salary Range</label><input className="input-box" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} />
          <label>Application Link (URL) *</label>
          <input className="input-box" type="url" value={form.applyLink || ""} onChange={(e) => setForm({ ...form, applyLink: e.target.value })} required placeholder="https://careers.company.com/..." />
          <label>Job Description *</label><textarea className="input-box" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <label>Requirements</label><textarea className="input-box" rows={4} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? "Saving..." : "Save Job"}</button>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JobCard = ({ job, onJobDeleted }) => {
  const [expanded, setExpanded] = useState(false); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const { user } = useAuth();
  
  const handleDeleteJob = async () => { 
    if (window.confirm("Delete job?")) { 
      try { 
        await axios.delete(`/api/jobs/${job.id}`); 
        toast.success("Deleted!"); 
        onJobDeleted(); 
      } catch (err) { toast.error("Failed to delete"); } 
    } 
  };
  
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0, marginBottom: 5 }}>{job.title}</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 10, fontSize: "16px" }}><strong>{job.company}</strong>{job.location && ` • ${job.location}`}</p>
          
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {job.job_type && <span className="job-tag job-tag-blue"><i className="fas fa-briefcase"></i> {job.job_type}</span>}
            {job.experience_level && <span className="job-tag job-tag-purple"><i className="fas fa-chart-line"></i> {job.experience_level}</span>}
            {job.salary_range && <span className="job-tag job-tag-green"><i className="fas fa-money-bill-wave"></i> {job.salary_range}</span>}
          </div>
          
           {expanded && (
              <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid var(--border-color)" }}>
                <h4 style={{ marginTop: 0 }}>Description</h4><p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.description}</p>
                {job.requirements && <><h4 style={{ marginTop: 15 }}>Requirements</h4><p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.requirements}</p></>}
                
                {/* NEW: Show the Application Link when expanded */}
                {job.apply_link && (
                  <div style={{ marginTop: 15, padding: "10px", background: "var(--bg-color)", borderRadius: "6px" }}>
                    <h4 style={{ margin: "0 0 5px 0", fontSize: "13px", color: "var(--text-muted)" }}>Application Link:</h4>
                    <a href={job.apply_link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", wordBreak: "break-all", fontSize: "14px" }}>
                      {job.apply_link}
                    </a>
                  </div>
                )}
                
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: 15 }}>Posted by: {job.first_name} {job.last_name}</p>
              </div>
            )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 15, flexWrap: "wrap" }}>
        
        {/* The new External Apply Link */}
        {user?.id !== job.posted_by && job.apply_link && (
          <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Apply Now <i className="fas fa-external-link-alt" style={{ marginLeft: 8, fontSize: "12px" }}></i>
          </a>
        )}
        
        <button className="btn-secondary" onClick={() => setExpanded(!expanded)}>{expanded ? "Show Less" : "View Details"}</button>
        
        {(user?.id === job.posted_by || user?.role === 'admin') && <button className="btn-secondary" onClick={() => setShowEditModal(true)}><i className="fas fa-edit"></i> Edit</button>}
        {(user?.id === job.posted_by || user?.role === 'admin') && <button className="btn-danger" onClick={handleDeleteJob}><i className="fas fa-trash"></i></button>}
      </div>
      
      {showEditModal && <JobFormModal job={job} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); onJobDeleted(); }} />}
    </div>
  );
};

const JobsPage = () => {
  const [jobs, setJobs] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const loadJobs = useCallback(async () => { 
    try { 
      const res = await axios.get("/api/jobs"); 
      setJobs(res.data.jobs || []); 
    } catch (err) { toast.error("Failed to load jobs"); } 
    finally { setLoading(false); } 
  }, []);
  
  useEffect(() => { loadJobs(); }, [loadJobs]);
  
  if (loading) return <PageSkeleton />;
    
  return (
    <div className="page-container"><Toaster />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Job Board</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}><i className="fas fa-plus"></i> Post Job</button>
      </div>
      {showCreateModal && <JobFormModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadJobs(); }} />}
      {jobs.length === 0 ? <div className="card"><p style={{ textAlign: "center", color: "var(--text-muted)" }}>No jobs posted yet.</p></div> : <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>{jobs.map((job) => <JobCard key={job.id} job={job} onJobDeleted={loadJobs} />)}</div>}
    </div>
  );
};

// ==============================
// CONNECTIONS PAGE
// ==============================
const ConnectionsPage = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]); 
  const [pending, setPending] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [tab, setTab] = useState("connections");

  const loadConnections = useCallback(async () => { 
    try { 
      const [connRes, pendRes] = await Promise.all([ axios.get("/api/connections?status=accepted"), axios.get("/api/connections/pending-requests") ]); 
      setConnections(connRes.data.connections || []); 
      setPending(pendRes.data.pending || []); 
    } catch (err) { toast.error("Failed to load connections"); } 
    finally { setLoading(false); } 
  }, []);
  
  useEffect(() => { loadConnections(); }, [loadConnections]);
  
  const handleRemoveConnection = async (connectionId) => {
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Guest accounts cannot modify connections."); return; } // <-- ADD CHECK
    if (window.confirm("Remove this connection?")) { 
      try { 
        await axios.delete(`/api/connections/${connectionId}`); 
        toast.success("Connection removed"); 
        loadConnections(); 
      } catch (err) { toast.error("Failed to remove"); } 
    } 
  };
  
  const handleAccept = async (connectionId) => { 
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Guest accounts cannot modify connections."); return; } // <-- ADD CHECK
    try { 
      await axios.post(`/api/connections/${connectionId}/accept`); 
      toast.success("Accepted!"); 
      loadConnections(); 
    } catch (err) { toast.error("Failed to accept"); } 
  };

  const handleReject = async (connectionId) => { 
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Guest accounts cannot modify connections."); return; } // <-- ADD CHECK
    try { 
      await axios.delete(`/api/connections/${connectionId}/reject`); 
      toast.success("Rejected"); 
      loadConnections(); 
    } catch (err) { toast.error("Failed to reject"); } 
  };

  if (loading) return <PageSkeleton />;
    
  return (
    <div className="page-container"><Toaster /><h1>My Network</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "2px solid var(--border-color)" }}>
        <button onClick={() => setTab("connections")} style={{ background: "none", border: "none", padding: "12px 0", fontSize: "16px", fontWeight: tab === "connections" ? "700" : "500", color: tab === "connections" ? "var(--primary)" : "var(--text-muted)", borderBottom: tab === "connections" ? "3px solid var(--primary)" : "none", cursor: "pointer" }}>Connections ({connections.length})</button>
        <button onClick={() => setTab("pending")} style={{ background: "none", border: "none", padding: "12px 0", fontSize: "16px", fontWeight: tab === "pending" ? "700" : "500", color: tab === "pending" ? "var(--primary)" : "var(--text-muted)", borderBottom: tab === "pending" ? "3px solid var(--primary)" : "none", cursor: "pointer" }}>Pending ({pending.length})</button>
      </div>
      
      {tab === "connections" && (
        <div>
          {connections.length === 0 ? ( <div className="card"><p style={{ textAlign: "center", color: "var(--text-muted)" }}>No connections yet.</p></div> ) : (
            <div className="grid-3">
              {connections.map((conn) => (
                <div key={conn.connection_id} className="card">
                  <h3 style={{ marginTop: 0 }}>{conn.first_name} {conn.last_name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{conn.headline || "Alumni"}</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Batch {conn.passout_year}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <Link to={`/alumni/${conn.connected_to}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: "13px", padding: "6px" }}>Profile</Link>
                    <button className="btn-cancel" onClick={() => handleRemoveConnection(conn.connected_to)} style={{ flex: 1, fontSize: "13px", padding: "6px" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {tab === "pending" && (
        <div>
          {pending.length === 0 ? ( <div className="card"><p style={{ textAlign: "center", color: "var(--text-muted)" }}>No pending requests</p></div> ) : (
            <div className="grid-2">
              {pending.map((req) => (
                <div key={req.connection_id} className="card" style={{ background: "var(--bg-color)" }}>
                  <h3 style={{ marginTop: 0, color: "var(--primary)" }}>{req.first_name} {req.last_name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{req.headline || "Alumni"}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 15 }}>
                    <button className="btn-primary" onClick={() => handleAccept(req.connection_id)} style={{ flex: 1, fontSize: "13px", padding: "8px" }}>Accept</button>
                    <button className="btn-secondary" onClick={() => handleReject(req.connection_id)} style={{ flex: 1, fontSize: "13px", padding: "8px" }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==============================
// MESSAGES PAGE
// ==============================
const MessagesPage = () => {
  const { user } = useAuth(); 
  const [isTyping, setIsTyping] = useState(false); 
  const typingTimeoutRef = useRef(null); 
  const [messages, setMessages] = useState([]); 
  const [newMessage, setNewMessage] = useState(""); 
  const [activeRoom, setActiveRoom] = useState(null); 
  const [chatPartner, setChatPartner] = useState(null); 
  const [inbox, setInbox] = useState([]); 
  const [searchParams] = useSearchParams(); 
  const targetUserId = searchParams.get("userId");

  const loadInbox = useCallback(async () => { 
    try { 
      const res = await axios.get("/api/inbox"); 
      setInbox(res.data.rooms || []); 
    } catch (err) { console.error("Failed to load inbox"); } 
  }, []);

  const fetchMessages = useCallback(async (roomId) => { 
    try { 
      const res = await axios.get(`/api/messages/${roomId}`); 
      setMessages(res.data.messages || []); 
    } catch (err) { console.error(err); } 
  }, []);

  const startChat = useCallback(async (otherUserId) => { 
    try { 
      const roomRes = await axios.post(`/api/messages/room/${otherUserId}`); 
      setActiveRoom(roomRes.data.room); 
      setChatPartner(roomRes.data.otherUser); 
      fetchMessages(roomRes.data.room.id); 
    } catch (err) { toast.error("Failed to start chat"); } 
  }, [fetchMessages]);

// --- UPDATED SOCKET.IO REAL-TIME LISTENER ---
  useEffect(() => {
    const socket = io(API_URL);

    if (activeRoom) {
      socket.emit("joinRoom", activeRoom.id);
      
      // 1. Tell the server we just opened the chat and read everything
      socket.emit("markAsRead", { roomId: activeRoom.id, userId: user.id });

      socket.on("receiveMessage", (newMsg) => {
        if (newMsg.sender_id !== user.id) {
          setMessages((prevMessages) => [...prevMessages, newMsg]);
          setIsTyping(false);
          
          // 2. We are actively looking at the chat, so mark this new incoming message as read immediately
          socket.emit("markAsRead", { roomId: activeRoom.id, userId: user.id });
        }
      });

      socket.on("userTyping", () => setIsTyping(true));
      socket.on("userStoppedTyping", () => setIsTyping(false));

      // 3. Listen for the OTHER person reading OUR messages
      socket.on("messagesRead", ({ readerId }) => {
        if (readerId !== user.id) {
          // Update all our sent messages to show the blue double tick
          setMessages(prev => prev.map(msg => 
            msg.sender_id === user.id ? { ...msg, read_status: 'read' } : msg
          ));
        }
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [activeRoom, user.id]);

  useEffect(() => { 
    if (targetUserId) { startChat(targetUserId); } else { loadInbox(); } 
  }, [targetUserId, startChat, loadInbox]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (activeRoom && user?.email !== 'alumninetworkplatform@gmail.com') {
      const socket = io(API_URL);
      socket.emit("typing", activeRoom.id);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", activeRoom.id);
      }, 2000);
    }
  };

  const sendMessage = async (e) => { 
    e.preventDefault(); 
    if (!newMessage.trim() || !activeRoom) return; 
    
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Guest accounts cannot send messages.");
      setNewMessage(""); 
      return;
    }
    
    try { 
      const res = await axios.post(`/api/messages/${activeRoom.id}`, { message: newMessage }); 
      
      setMessages(prev => [...prev, res.data.message]);
      setNewMessage(""); 
    } catch (err) { toast.error("Failed to send message"); } 
  };

  const deleteChat = async () => {
    if(window.confirm("Are you sure you want to permanently delete this entire chat history?")) {
      try {
        await axios.delete(`/api/messages/room/${activeRoom.id}`);
        setActiveRoom(null);
        setChatPartner(null);
        loadInbox();
        toast.success("Chat deleted");
      } catch(err) { toast.error("Failed to delete chat"); }
    }
  };

  return (
    <div className="page-container"><Toaster />
      <div className="card" style={{ display: "flex", flexDirection: "column", height: "70vh", padding: 0, overflow: "hidden" }}>
        
        <div style={{ padding: "15px 20px", background: "var(--bg-color)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            {activeRoom && <button onClick={() => { setActiveRoom(null); setChatPartner(null); loadInbox(); }} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}><i className="fas fa-arrow-left"></i> Back</button>}
            <h2 style={{ margin: 0, fontSize: "18px" }}>{chatPartner ? `Chat with ${chatPartner.first_name} ${chatPartner.last_name}` : "Messages Inbox"}</h2>
          </div>
          
          {activeRoom && (
            <button onClick={deleteChat} className="btn-danger" style={{ padding: "6px 12px", fontSize: "13px" }}>
              <i className="fas fa-trash"></i> Delete Chat
            </button>
          )}
        </div>

        <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", background: "var(--card-bg)" }}>
          {!activeRoom ? (
            inbox.length === 0 ? ( <div style={{ margin: "auto", color: "var(--text-muted)", textAlign: "center" }}><i className="fas fa-inbox fa-3x" style={{ marginBottom: 10 }}></i><p>Your inbox is empty.</p></div> ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {inbox.map((item) => (
                  <div key={item.room.id} onClick={() => startChat(item.otherUser.id)} style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px", border: "1px solid var(--border-color)", borderRadius: "12px", cursor: "pointer" }}>
                    <div style={{ width: 45, height: 45, background: "var(--primary)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold" }}>{item.otherUser.first_name[0]}</div>
                    <div>
                       <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>{item.otherUser.first_name} {item.otherUser.last_name}{item.hasUnread && <span style={{ width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>}</h4>
                       <p style={{ margin: 0, fontSize: "13px", color: item.hasUnread ? "#ef4444" : "var(--text-muted)", fontWeight: item.hasUnread ? "bold" : "normal" }}>{item.hasUnread ? "New message!" : "Click to open chat"}</p>
                     </div>
                  </div>
                ))}
              </div>
            )
          ) : messages.length === 0 ? ( <div style={{ margin: "auto", color: "var(--text-muted)", textAlign: "center" }}><i className="fas fa-comments fa-3x" style={{ marginBottom: 10 }}></i><p>No messages yet. Say hi! 👋</p></div> ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={isMe ? 'message-bubble message-mine' : 'message-bubble message-theirs'}>
                  <div>{msg.message}</div>
                  
                  {/* --- UPDATED MESSAGE METADATA (TIME + CHECKMARKS) --- */}
                  <div style={{ 
                    fontSize: "10px", 
                    opacity: 0.8, 
                    marginTop: "5px", 
                    display: "flex", 
                    justifyContent: isMe ? "flex-end" : "flex-start", 
                    alignItems: "center", 
                    gap: "6px" 
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    
                    {/* Only show checkmarks if I sent the message */}
                    {isMe && (
                      <span style={{ fontSize: "11px", color: msg.read_status === 'read' ? "#3b82f6" : "inherit" }}>
                        {msg.read_status === 'read' ? (
                          <i className="fas fa-check-double"></i> /* Blue Double Tick */
                        ) : msg.read_status === 'delivered' ? (
                          <i className="fas fa-check-double"></i> /* Grey Double Tick */
                        ) : (
                          <i className="fas fa-check"></i> /* Single Grey Tick */
                        )}
                      </span>
                    )}
                  </div>
                  {/* ---------------------------------------------------- */}

                </div>
              );
            })
          )}
        </div>

        {activeRoom && (
          <>
            {isTyping && chatPartner && (
              <div style={{ padding: "0 20px 10px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                {chatPartner.first_name} is typing...
              </div>
            )}
            <form onSubmit={sendMessage} style={{ display: "flex", padding: "15px", background: "var(--bg-color)", borderTop: "1px solid var(--border-color)" }}>
              <input type="text" className="input-box" value={newMessage} onChange={handleTyping} placeholder="Type a message..." style={{ flex: 1, borderRadius: "24px", marginBottom: 0 }} />
              <button type="submit" className="btn-primary" style={{ borderRadius: "50%", width: "45px", height: "45px", marginLeft: "10px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fas fa-paper-plane"></i></button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// ==============================
// DASHBOARD, ADMIN & EDIT PROFILE
// ==============================
const DashboardPage = () => {
  const { user } = useAuth(); 
  const [stats, setStats] = useState({ alumniCount: 0, activeJobs: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [batchmates, setBatchmates] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  
  useEffect(() => { 
    const loadDashboardData = async () => { 
      try { 
        // 1. Fetch aggregate stats and pending connections using existing routes
        const [alumniRes, jobsRes, pendingRes] = await Promise.all([ 
          axios.get("/api/users/directory?limit=100"), 
          axios.get("/api/jobs"),
          axios.get("/api/connections/pending-requests")
        ]); 
        
        const allAlumni = alumniRes.data.users || [];
        const allJobs = jobsRes.data.jobs || [];

        setStats({ alumniCount: allAlumni.length, activeJobs: allJobs.length });
        
        // 2. Grab just the 3 newest jobs for the snapshot
        setRecentJobs(allJobs.slice(0, 3)); 
        setPendingCount(pendingRes.data.pending?.length || 0);

        // 3. Find batchmates (people who graduated the same year)
        if (user?.passout_year) {
          const batchRes = await axios.get(`/api/users/directory?passoutYear=${user.passout_year}`);
          // Filter out the current user, and take the first 4
          const peers = (batchRes.data.users || []).filter(u => u.id !== user.id).slice(0, 4);
          setBatchmates(peers);
        }
      } catch (err) { console.error("Dashboard load error", err); } 
    }; 
    if (user) loadDashboardData(); 
  }, [user]);
  
  return (
    <div className="page-container" style={{ maxWidth: "1000px" }}>
      <Toaster />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>Dashboard</h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Welcome back to your command center.</p>
        </div>
        <Link to="/profile/edit" className="btn-secondary" style={{ fontSize: "14px", padding: "8px 16px" }}>
          <i className="fas fa-edit" style={{ marginRight: "5px" }}></i> Edit Profile
        </Link>
      </div>

      {/* --- ACTIONABLE ALERTS --- */}
      {pendingCount > 0 && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "15px 20px", borderRadius: "8px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1d4ed8", fontWeight: "600" }}>
            <i className="fas fa-user-friends" style={{ fontSize: "20px" }}></i>
            You have {pendingCount} new connection request{pendingCount > 1 ? 's' : ''} waiting!
          </div>
          <button onClick={() => navigate("/connections")} className="btn-primary" style={{ padding: "6px 12px", fontSize: "13px" }}>Review</button>
        </div>
      )}

      {/* --- QUICK STATS (Refined) --- */}
      <div className="grid-3" style={{ marginBottom: 30 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#e0f2fe", color: "#2563eb", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}><i className="fas fa-users"></i></div>
          <div><p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)" }}>Network Size</p><h2 style={{ margin: 0, fontSize: "28px" }}>{stats.alumniCount}</h2></div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#f3e8ff", color: "#7c3aed", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}><i className="fas fa-briefcase"></i></div>
          <div><p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)" }}>Active Jobs</p><h2 style={{ margin: 0, fontSize: "28px" }}>{stats.activeJobs}</h2></div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#dcfce7", color: "#15803d", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}><i className="fas fa-id-badge"></i></div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)" }}>Status</p>
            <h3 style={{ margin: "2px 0", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.headline || "Headline not set"}</h3>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "30px" }}>
        
        {/* --- BATCHMATES SECTION --- */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>Batch of {user?.passout_year}</h3>
            <Link to="/alumni" className="text-blue" style={{ fontSize: "13px", fontWeight: "600" }}>View All Directory →</Link>
          </div>
          <div className="card" style={{ padding: "0" }}>
            {batchmates.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", margin: 0 }}>No other batchmates registered yet. Invite them!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {batchmates.map((peer, index) => (
                  <div key={peer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", borderBottom: index < batchmates.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                     <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{peer.first_name[0]}</div>
                        <div>
                        <h4 style={{ margin: 0 }}>{peer.first_name} {peer.last_name}</h4>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{peer.headline || "Alumni"}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/alumni/${peer.id}`)} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>Profile</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- LATEST JOBS SECTION --- */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>Recent Opportunities</h3>
            <Link to="/jobs" className="text-blue" style={{ fontSize: "13px", fontWeight: "600" }}>Go to Job Board →</Link>
          </div>
          <div className="card" style={{ padding: "0" }}>
            {recentJobs.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", margin: 0 }}>No jobs posted yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recentJobs.map((job, index) => (
                  <div key={job.id} style={{ padding: "15px 20px", borderBottom: index < recentJobs.length - 1 ? "1px solid var(--border-color)" : "none", cursor: "pointer" }} onClick={() => navigate("/jobs")}>
                    <h4 style={{ margin: "0 0 5px 0", color: "var(--primary)" }}>{job.title}</h4>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "500" }}>{job.company} {job.location && <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>• {job.location}</span>}</p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569", fontWeight: "600" }}>{job.job_type}</span>
                      <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569", fontWeight: "600" }}>{job.experience_level}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
// --- NEW: Array of our funny templates ---
const EMAIL_TEMPLATES = [
  {
    subject: "Hello World! (It's been a while) 👋",
    message: "Just a quick ping to see how you are doing!\n\nThe ConnectAlumni network has been growing, and your batchmates are missing you. We have some fresh job postings and new conversations happening right now.\n\nTake a quick break from your screen and come say hi!"
  },
  {
    subject: "Error 404: Alumni Not Found 🔍",
    message: "We ran a search for you on the network recently, but you were nowhere to be found!\n\nDon't worry, we saved your spot. The Chaibasa Engineering community has been sharing some great new job referrals and interview tips this week.\n\nLog back in and let us know what you've been working on lately!"
  },
  {
    subject: "While your code is compiling... ⏳",
    message: "...why not check in with your college network?\n\nWe know you are busy, but there are some new job opportunities and alumni discussions waiting for you. It only takes a minute to see what’s new.\n\nGrab some water, stretch your legs, and come see what your batchmates are up to!"
  }
];

const getRandomTemplate = () => {
  return EMAIL_TEMPLATES[Math.floor(Math.random() * EMAIL_TEMPLATES.length)];
};

const AdminPanel = () => {
  const { user } = useAuth(); 
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for the Custom Email Form (Initializes with a random template!)
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailForm, setEmailForm] = useState({
    targetEmail: "",
    ...getRandomTemplate() // Spreads the random subject and message into the state
  });
  
  const fetchUsers = async (search = "") => { 
    try { 
      setLoading(true); 
      const res = await axios.get(`/api/admin/users?search=${search}`); 
      setUsers(res.data.users); 
    } catch (err) { toast.error("Failed to load users"); } 
    finally { setLoading(false); } 
  };
  
  useEffect(() => { fetchUsers(); }, []);
  
  const handleSearch = (e) => { e.preventDefault(); fetchUsers(searchTerm); };
  
  const handleToggleBan = async (targetUser) => { 
    const action = targetUser.is_banned ? "unban" : "ban"; 
    if (!window.confirm(`Are you sure you want to ${action} ${targetUser.first_name}?`)) return; 
    try { 
      await axios.patch(`/api/admin/users/${targetUser.id}/${action}`); 
      toast.success(`User successfully ${action}ned`); 
      fetchUsers(searchTerm); 
    } catch (err) { toast.error("Failed"); } 
  };
  
  const handleRoleChange = async (targetUser) => { 
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin'; 
    if (!window.confirm(`Make ${targetUser.first_name} a ${newRole}?`)) return; 
    try { 
      await axios.patch(`/api/admin/users/${targetUser.id}/role`, { role: newRole }); 
      toast.success(`Updated`); 
      fetchUsers(searchTerm); 
    } catch (err) { toast.error("Failed"); } 
  };

  // --- NEW: Function to cycle templates without reloading ---
  const shuffleTemplate = (e) => {
    e.preventDefault(); // Stop form submission
    const newTemp = getRandomTemplate();
    setEmailForm(prev => ({ ...prev, subject: newTemp.subject, message: newTemp.message }));
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!emailForm.targetEmail.trim()) {
      const confirmed = window.confirm("🚨 WARNING: You left the target email blank. This will send an email to EVERY verified user on the platform. Are you sure?");
      if (!confirmed) return;
    }

    setIsEmailing(true);
    try {
      await axios.post("/api/admin/broadcast-email", {
        targetEmail: emailForm.targetEmail.trim() || undefined,
        subject: emailForm.subject,
        message: emailForm.message
      });
      toast.success("Emails successfully sent!");
      // Reset form but pick a new random template for next time!
      setEmailForm({ targetEmail: "", ...getRandomTemplate() });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send emails");
    } finally {
      setIsEmailing(false);
    }
  };
  
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  
  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <Toaster />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <i className="fas fa-shield-alt" style={{ fontSize: "28px", color: "#dc2626" }}></i>
        <h1 style={{ margin: 0 }}>Admin Panel</h1>
      </div>

      <div className="card" style={{ marginBottom: "30px", borderLeft: "4px solid #8b5cf6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fas fa-paper-plane" style={{ color: "#8b5cf6" }}></i> Send Custom Email Broadcast
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
              Write a custom message, or cycle through our templates. Leave "Target Email" blank to email <strong>everyone</strong>.
            </p>
          </div>
          
          {/* --- THE SHUFFLE BUTTON --- */}
          <button 
            onClick={shuffleTemplate} 
            className="btn-secondary" 
            style={{ padding: "6px 12px", fontSize: "13px" }}
            type="button"
          >
            🎲 Shuffle Template
          </button>
        </div>
        
        <form onSubmit={handleSendBroadcast}>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 250px" }}>
              <label>Target Email (Optional)</label>
              <input 
                className="input-box" 
                type="email" 
                placeholder="Leave blank for ALL users..." 
                value={emailForm.targetEmail} 
                onChange={(e) => setEmailForm({...emailForm, targetEmail: e.target.value})} 
                disabled={isEmailing}
              />
            </div>
            <div style={{ flex: "1 1 350px" }}>
              <label>Email Subject *</label>
              <input 
                className="input-box" 
                type="text" 
                value={emailForm.subject} 
                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} 
                required 
                disabled={isEmailing}
              />
            </div>
          </div>
          
          <label>Message Body *</label>
          <textarea 
            className="input-box" 
            rows="5" 
            value={emailForm.message} 
            onChange={(e) => setEmailForm({...emailForm, message: e.target.value})} 
            required 
            disabled={isEmailing}
            style={{ resize: "vertical" }}
          />
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isEmailing}
            style={{ background: "#8b5cf6", width: "100%", marginTop: "10px" }}
          >
            {isEmailing ? (
              <><i className="fas fa-spinner fa-spin" style={{ marginRight: 5 }}></i> Sending Emails...</>
            ) : (
              <><i className="fas fa-envelope" style={{ marginRight: 5 }}></i> Send Broadcast</>
            )}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Manage Users</h3>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input type="text" className="input-box" placeholder="Search by name, email, or batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: 0, flex: 1 }} />
          <button type="submit" className="btn-primary">Search</button>
        </form>
        {loading ? <PageSkeleton /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: "15px", borderBottom: "1px solid var(--border-color)", gap: "10px" }}>
                <div>
                  <strong>{u.first_name} {u.last_name}</strong> 
                  <span style={{ color: "var(--text-muted)", marginLeft: 10 }}>{u.email}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: 10 }}>• Batch {u.passout_year}</span>
                  {u.role === 'admin' && <span className="admin-badge">ADMIN</span>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {u.id !== user.id && <button onClick={() => handleRoleChange(u)} className="btn-secondary">{u.role === 'admin' ? "Remove Admin" : "Make Admin"}</button>}
                  {u.role !== 'admin' && <button onClick={() => handleToggleBan(u)} className="btn-danger">{u.is_banned ? "Unban" : "Ban"}</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EditProfile = () => {
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", headline: "", bio: "", location: "", company: "", collegeName: "", studentId: "", mobileNo: "", branch: "", linkedinUrl: "", githubUrl: "", openTo: "" });
  
  useEffect(() => { 
    if (user) setForm({ 
      firstName: user.first_name||"", 
      lastName: user.last_name||"", 
      headline: user.headline||"", 
      bio: user.bio||"", 
      location: user.location||"", 
      company: user.company||"", 
      collegeName: user.college_name||"Chaibasa Engineering College",
      studentId: user.student_id||"",
      mobileNo: user.mobile_no||"",
      branch: user.branch||"",
      linkedinUrl: user.linkedin_url||"",
      githubUrl: user.github_url||"",
      openTo: user.open_to||""
    }); 
  }, [user]);
  
  const submit = async (e) => { 
    e.preventDefault(); 
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Guest profiles cannot be modified. Please create your own account!");
      return; 
    }
    try { 
      await axios.put("/api/users/profile", form); 
      toast.success("Updated!"); 
      setTimeout(() => window.location.reload(), 1000); 
    } catch (err) { toast.error("Failed to update"); } 
  };
  
  const handleDeleteAccount = async () => { 
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Guest accounts cannot be deleted.");
      return; 
    }
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone."); 
    if (!confirmed) return; 
    const doubleConfirm = window.confirm("Type 'DELETE' in your mind - this will permanently delete all your data including jobs, applications, and profile."); 
    if (!doubleConfirm) return; 
    try { 
      await axios.delete("/api/users/account"); 
      toast.success("Account deleted successfully!"); 
      logout(); 
      navigate("/login"); 
    } catch (err) { toast.error("Failed to delete account"); } 
  };

  return (
    <div className="page-container" style={{ maxWidth: 700 }}><Toaster />
      <div className="card"><h2>Edit Profile</h2>
        <form onSubmit={submit}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}><label>First Name *</label><input className="input-box" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div style={{ flex: "1 1 200px" }}><label>Last Name *</label><input className="input-box" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
          </div>
          
          <label>Headline / Current Role</label><input className="input-box" placeholder="e.g., Software Engineer at Google" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}><label>College Name *</label><input className="input-box" value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} required /></div>
           <div style={{ flex: "1 1 200px" }}><label>Student ID / Univ. Roll No. (Optional)</label><input className="input-box" placeholder="e.g., 239001001132" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} /></div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label>Branch (Optional)</label>
              <select className="input-box" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                <option value="">Select Branch</option>
                <option value="CSE">Computer Science & Engineering (CSE)</option>
                <option value="EE">Electrical Engineering (EE)</option>
                <option value="ECE">Electronics & Communication (ECE)</option>
                <option value="CE">Civil Engineering (CE)</option>
                <option value="ME">Mechanical Engineering (ME)</option>
              </select>
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label>Networking Goals (I am open to...)</label>
              <select className="input-box" value={form.openTo} onChange={(e) => setForm({ ...form, openTo: e.target.value })}>
                <option value="">Select a goal</option>
                <option value="Offering Referrals & Mentorship">Offering Referrals & Mentorship</option>
                <option value="Looking for Opportunities">Looking for Opportunities</option>
                <option value="Hiring for my Team">Hiring for my Team</option>
                <option value="General Networking">General Networking</option>
                <option value="Collaborating on Projects">Collaborating on Projects</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}><label>Company (Optional)</label><input className="input-box" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            <div style={{ flex: "1 1 200px" }}><label>Location (Optional)</label><input className="input-box" placeholder="e.g., Bangalore, India" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}><label>LinkedIn URL (Optional)</label><input type="url" className="input-box" placeholder="https://linkedin.com/in/..." value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} /></div>
            <div style={{ flex: "1 1 200px" }}><label>GitHub / Portfolio URL (Optional)</label><input type="url" className="input-box" placeholder="https://github.com/..." value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} /></div>
          </div>

          <label>Mobile Number (Optional)</label>
          <input className="input-box" type="tel" placeholder="+91 9876543210" value={form.mobileNo} onChange={(e) => setForm({ ...form, mobileNo: e.target.value })} />

          <label>About / Bio (Optional)</label><textarea className="input-box" rows={4} placeholder="Tell the network about yourself..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          
          <button className="btn-primary" style={{ width: "100%", marginTop: 15 }}>Save Changes</button>
        </form>
      </div>
      
      <div className="card" style={{ marginTop: 20, background: "#fee2e2", border: "1px solid #fca5a5" }}>
        <h3 style={{ marginTop: 0, color: "#dc2626" }}>Danger Zone</h3>
        <p style={{ color: "#991b1b", marginBottom: 15 }}>Permanently delete your account and all associated data.</p>
        <button className="btn-danger" onClick={handleDeleteAccount} style={{ width: "100%" }}>
          <i className="fas fa-trash-alt" style={{ marginRight: 5 }}></i> Delete My Account
        </button>
      </div>
    </div>
  );
};

const AlumniList = () => {
  const [alumni, setAlumni] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState("");
  
  const loadAlumni = async (search = "") => { 
    try { 
      setLoading(true); 
      const res = await axios.get(`/api/users/directory?search=${search}`); 
      setAlumni(res.data.users || []); 
    } catch (err) { toast.error("Failed to load alumni"); } 
    finally { setLoading(false); } 
  };
  
  useEffect(() => { loadAlumni(); }, []);
  const handleSearch = (e) => { e.preventDefault(); loadAlumni(searchTerm); };
  
  return (
    <div className="page-container"><Toaster /><h1>Alumni Directory</h1>
      <div className="card" style={{ marginBottom: 20 }}>
        {/* CHANGED PLACEHOLDER */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}><input type="text" className="input-box" placeholder="Search by name, email, or batch (e.g., 2026)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: 0, flex: 1 }} /><button type="submit" className="btn-primary">Search</button></form>
      </div>
      {loading ? <PageSkeleton /> : (
        
        <div className="grid-3">
          {alumni.map((person) => (
            <div key={person.id} className="card"><h3 style={{ marginTop: 0 }}>{person.first_name} {person.last_name}</h3><p style={{ color: "var(--text-muted)" }}>{person.headline}</p><Link to={`/alumni/${person.id}`} className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>View Profile</Link></div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==============================
// 404 NOT FOUND PAGE
// ==============================
const NotFoundPage = () => {
  return (
    <div className="page-container" style={{ textAlign: "center", marginTop: "10vh" }}>
      <h1 style={{ fontSize: "80px", margin: "0", color: "var(--primary)" }}>404</h1>
      <h2 style={{ marginTop: "10px" }}>Page Not Found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
        Looks like this page got lost in the campus network.
      </p>
      <Link to="/" className="btn-primary" style={{ display: "inline-block" }}>
        Return to Feed
      </Link>
    </div>
  );
};

// Smart routing: Shows Feed if logged in, Landing Page if not.
const IndexRoute = () => {
  const { user, loading, login } = useAuth(); // <-- Make sure login is extracted here
  const [isGuestStarting, setIsGuestStarting] = useState(false);
  
  // Use the new PageSkeleton while checking auth or logging in the guest
  if (loading || isGuestStarting) return <PageSkeleton />; 

  if (user) {
    return <PrivateLayout><FeedPage /></PrivateLayout>;
  }

  // This function logs them in silently in the background
  const handleSilentGuestLogin = async () => {
    setIsGuestStarting(true);
    try {
      await login("alumninetworkplatform@gmail.com", "Guest123!");
      toast.success("Welcome to the Guest Feed!");
      // The state updates, user becomes true, and it automatically renders the FeedPage!
    } catch (err) {
      toast.error("Could not load guest feed.");
      setIsGuestStarting(false);
    }
  };

  return <LandingPage onExploreAsGuest={handleSilentGuestLogin} />;
};

// ==============================
// MAIN APP ROUTER
// ==============================
function App() {
  // --- NEW: Global Theme Initialization ---
  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
    }
  }, []);
  // ----------------------------------------

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          <Route path="/" element={<IndexRoute />} />
          <Route path="/post/:id" element={<PrivateRoute><PrivateLayout><SinglePostPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><PrivateLayout><DashboardPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><PrivateLayout><AdminPanel /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni" element={<PrivateRoute><PrivateLayout><AlumniList /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni/:id" element={<PrivateRoute><PrivateLayout><AlumniProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/connections" element={<PrivateRoute><PrivateLayout><ConnectionsPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/profile/edit" element={<PrivateRoute><PrivateLayout><EditProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><PrivateLayout><MessagesPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><PrivateLayout><JobsPage /></PrivateLayout></PrivateRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
