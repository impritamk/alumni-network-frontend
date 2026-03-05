import "./styles.css";
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

// ==============================
// AXIOS CONFIG
// ==============================
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
axios.defaults.baseURL = API_URL;
console.log("🔧 API URL:", API_URL);

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
  const [isDark, setIsDark] = useState(document.body.classList.contains("dark-mode")); 
  
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

  const toggleDarkMode = () => { 
    document.body.classList.toggle("dark-mode"); 
    setIsDark(!isDark); 
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
      
      {/* DESKTOP MENU */}
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

      {/* MOBILE HAMBURGER BUTTON */}
      <button className="navbar-hamburger-btn" onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--primary)", position: "relative" }}>
        <i className="fas fa-bars"></i>
        {(indicators.hasNewJobs || indicators.hasUnreadMessages) && <Dot />}
      </button>

      {/* MOBILE DRAWER MENU */}
      {menuOpen && <div className="drawer-overlay" onClick={() => setMenuOpen(false)}></div>}
      <div className={`mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => setMenuOpen(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <i className="fas fa-times"></i>
        </button>
        
        <Link to="/" className="drawer-link" onClick={() => setMenuOpen(false)}>Feed</Link>
        <Link to="/dashboard" className="drawer-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link to="/alumni" className="drawer-link" onClick={() => setMenuOpen(false)}>Alumni Directory</Link>
        <Link to="/connections" className="drawer-link" onClick={() => setMenuOpen(false)}>Connections</Link>
        
        <Link to="/messages" className="drawer-link" onClick={() => { setMenuOpen(false); setIndicators(prev => ({...prev, hasUnreadMessages: false})); }}>
          Messages {indicators.hasUnreadMessages && "🔴"}
        </Link>
        
        <Link to="/jobs" className="drawer-link" onClick={() => { setMenuOpen(false); setIndicators(prev => ({...prev, hasNewJobs: false})); }}>
          Jobs {indicators.hasNewJobs && "🔴"}
        </Link>
        
        {user?.role === 'admin' && (
          <Link to="/admin" className="drawer-link" onClick={() => setMenuOpen(false)} style={{ color: '#ef4444', fontWeight: 'bold' }}>Admin Panel</Link>
        )}
        
        <Link to="/profile/edit" className="drawer-link" onClick={() => setMenuOpen(false)}>Edit Profile</Link>
        
        <button onClick={toggleDarkMode} style={{ background: "none", border: "none", color: "var(--text-muted)", textAlign: "left", padding: "10px 0", fontSize: '18px', cursor: "pointer" }}>
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        
        <button onClick={doLogout} className="btn-danger" style={{ marginTop: 'auto' }}>Logout</button>
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
// AUTH PAGES (LOGIN / REGISTER / OTP)
// ==============================
const LoginPage = () => {
  const { login } = useAuth(); 
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
      setTimeout(() => { window.location.href = "/"; }, 500); 
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

  const submit = async (e) => {
    e.preventDefault(); 
    if (form.password !== form.confirmPassword) { toast.error("Passwords mismatch!"); return; }
    try { 
      await register(form); 
      localStorage.setItem("pendingEmail", form.email.toLowerCase().trim()); 
      toast.success("OTP sent!"); 
      window.location.href = "/verify-otp"; 
    } catch (err) { 
      toast.error(err.response?.data?.message || "Registration failed"); 
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 500 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Create Account</h2>
        <form onSubmit={submit}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><label>First Name</label><input className="input-box" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Last Name</label><input className="input-box" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
          </div>
          
          <label>Email</label>
          <input className="input-box" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          
          <label>College Name</label>
          <input className="input-box" type="text" value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} required />
          
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input-box" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: '40px' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
            </button>
          </div>
          
          <label>Confirm Password</label>
          <input className="input-box" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
          
          <label>Passout Year</label>
          <input className="input-box" type="number" value={form.passoutYear} onChange={(e) => setForm({ ...form, passoutYear: e.target.value })} required />
          
          <button className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>Register</button>
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
    } catch (err) { 
      toast.error(err.response?.data?.message || "Invalid OTP"); 
    } 
  };

  const handleResendOtp = async () => { 
    if (!canResend || resending) return; 
    setResending(true); 
    try { 
      const email = localStorage.getItem("pendingEmail"); 
      if (!email) { toast.error("Email not found."); navigate("/register"); return; } 
      await axios.post("/api/auth/resend-otp", { email }); 
      toast.success("New OTP sent!"); 
      setCanResend(false); 
      setCountdown(60); 
      setOtp(""); 
    } catch (err) { 
      toast.error("Failed to resend OTP"); 
    } finally { 
      setResending(false); 
    } 
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
// ALUMNI PROFILE
// ==============================
const AlumniProfile = () => {
  const { id } = useParams(); 
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);

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
  }, [id]);

  if (loading) return <div className="page-container"><div className="card" style={{ textAlign: "center", color: "var(--text-muted)" }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading profile...</p></div></div>;
  if (error || !profileUser) return <div className="page-container"><Toaster /><div className="card" style={{ textAlign: "center" }}><h2><i className="fas fa-user-slash" style={{ color: "var(--danger)", marginRight: 10 }}></i>User Not Found</h2><p style={{ color: "var(--text-muted)", marginBottom: 15 }}>{error || "This user profile could not be found."}</p><Link to="/alumni" className="btn-primary" style={{ display: "inline-block" }}>Back to Alumni List</Link></div></div>;
  
  return (
    <div className="page-container"><Toaster />
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center' }}>
          {profileUser.first_name} {profileUser.last_name}
          {profileUser.role === 'admin' && <span className="admin-badge">ADMIN</span>}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "18px", marginTop: 5 }}>{profileUser.headline || "Alumni"}</p>
        
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
          <p><b><i className="fas fa-graduation-cap" style={{ color: "var(--primary)", width: 20 }}></i> Batch:</b> {profileUser.passout_year || "N/A"}</p>
          <p><b><i className="fas fa-university" style={{ color: "var(--primary)", width: 20 }}></i> College:</b> {profileUser.college_name || "Chaibasa Engineering College"}</p>
          {profileUser.email && <p><b><i className="fas fa-envelope" style={{ color: "var(--primary)", width: 20 }}></i> Email:</b> {profileUser.email}</p>}
          {profileUser.current_company && <p><b><i className="fas fa-building" style={{ color: "var(--primary)", width: 20 }}></i> Company:</b> {profileUser.current_company}</p>}
          {profileUser.location && <p><b><i className="fas fa-map-marker-alt" style={{ color: "var(--primary)", width: 20 }}></i> Location:</b> {profileUser.location}</p>}
        </div>
        
        {profileUser.bio && <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}><h3 style={{ marginTop: 0 }}>About</h3><p style={{ lineHeight: 1.6 }}>{profileUser.bio}</p></div>}
        
        {currentUser && currentUser.id !== parseInt(id) && (
          <div style={{ marginTop: 25, display: "flex", gap: 10 }}>
            <ConnectButton userId={id} />
          </div>
        )}
      </div>
      <Link to="/alumni" className="text-blue" style={{ display: "inline-block", marginTop: 20, fontSize: "16px" }}>← Back to Alumni List</Link>
    </div>
  );
};

// ==============================
// COMMUNITY FEED (HOMEPAGE)
// ==============================
const PostItem = ({ post, user, onDelete, onRefresh }) => {
  const [showComments, setShowComments] = useState(false); 
  const [commentText, setCommentText] = useState(""); 
  const [isLiking, setIsLiking] = useState(false);
  const navigate = useNavigate();

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
  
  return (
    <div className="card" style={{ marginBottom: "15px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* CLICKABLE HEADER FOR PROFILE ROUTING */}
        <div 
          className="post-header" 
          onClick={() => navigate(`/alumni/${post.user_id}`)}
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
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>{new Date(post.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        {(user?.role === 'admin' || user?.id === post.user_id) && (
          <button onClick={() => onDelete(post.id)} className="btn-danger" style={{ padding: "4px 10px", fontSize: "12px" }}><i className="fas fa-trash"></i></button>
        )}
      </div>
      
      <p style={{ margin: "10px 0 15px 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{post.content}</p>
      
      <div style={{ display: "flex", gap: "15px", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
        <button onClick={handleLike} disabled={isLiking} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: post.user_liked ? "var(--danger)" : "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className={post.user_liked ? "fas fa-heart" : "far fa-heart"}></i> {post.like_count || 0} Likes
        </button>
        <button onClick={() => setShowComments(!showComments)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className="far fa-comment"></i> {post.comments?.length || 0} Comments
        </button>
      </div>

      {showComments && (
        <div style={{ marginTop: "15px", background: "var(--bg-color)", padding: "15px", borderRadius: "8px" }}>
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
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>{new Date(c.created_at).toLocaleDateString()}</span>
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

const FeedPage = () => {
  const { user } = useAuth(); 
  const [posts, setPosts] = useState([]); 
  const [content, setContent] = useState(""); 
  const [loading, setLoading] = useState(true); 
  const [sortOption, setSortOption] = useState("latest");
  
  const fetchPosts = useCallback(async () => { 
    try { 
      const res = await axios.get(`/api/posts?sort=${sortOption}`); 
      setPosts(res.data.posts); 
    } catch (err) { toast.error("Failed to load posts"); } 
    finally { setLoading(false); } 
  }, [sortOption]);
  
  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    try { 
      await axios.post("/api/posts", { content }); 
      setContent(""); 
      fetchPosts(); 
      toast.success("Posted!"); 
    } catch (err) { toast.error("Failed to post"); } 
  };
  
  const handleDelete = async (postId) => { 
    if (!window.confirm("Delete post?")) return; 
    try { 
      await axios.delete(`/api/posts/${postId}`); 
      fetchPosts(); 
      toast.success("Deleted"); 
    } catch (err) { toast.error("Failed to delete"); } 
  };

  if (loading) return <div className="page-container"><p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading feed...</p></div>;
  
  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Toaster />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>Welcome back, {user?.first_name || "Alumni"}! 👋</h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Here is what's happening in your community today.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/alumni" className="btn-secondary" style={{ textDecoration: "none" }}><i className="fas fa-search" style={{ marginRight: 5 }}></i> Find Alumni</Link>
          <Link to="/jobs" className="btn-primary" style={{ textDecoration: "none" }}><i className="fas fa-briefcase" style={{ marginRight: 5 }}></i> View Jobs</Link>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <textarea className="input-box" rows="3" placeholder="Share an update, ask a question, or post an opportunity..." value={content} onChange={(e) => setContent(e.target.value)} required style={{ resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <select className="input-box" value={sortOption} onChange={(e)=>setSortOption(e.target.value)} style={{ width: '150px', marginBottom: 0, padding: '8px' }}>
              <option value="latest">Latest</option>
              <option value="top">Most Liked</option>
              <option value="oldest">Oldest</option>
            </select>
            <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}><i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i> Post</button>
          </div>
        </form>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column" }}>
        {posts.map(post => <PostItem key={post.id} post={post} user={user} onDelete={handleDelete} onRefresh={fetchPosts} />)}
        {posts.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No posts yet. Break the ice!</p>}
      </div>
    </div>
  );
};

// ==============================
// JOBS COMPONENT & TAGS FIX
// ==============================
const JobFormModal = ({ job, onClose, onSuccess }) => {
  const isEdit = !!job; 
  const [form, setForm] = useState(job || { title: "", company: "", description: "", requirements: "", location: "", salaryRange: "", jobType: "Full-time", experienceLevel: "Mid-level" }); 
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
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
  const [showApplyModal, setShowApplyModal] = useState(false); 
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
          
          {/* 🟢 THE JOB TAGS BUG FIX 🟢 */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {job.job_type && <span className="job-tag job-tag-blue"><i className="fas fa-briefcase"></i> {job.job_type}</span>}
            {job.experience_level && <span className="job-tag job-tag-purple"><i className="fas fa-chart-line"></i> {job.experience_level}</span>}
            {job.salary_range && <span className="job-tag job-tag-green"><i className="fas fa-money-bill-wave"></i> {job.salary_range}</span>}
          </div>
          
          {expanded && (
            <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid var(--border-color)" }}>
              <h4 style={{ marginTop: 0 }}>Description</h4><p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.description}</p>
              {job.requirements && <><h4 style={{ marginTop: 15 }}>Requirements</h4><p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.requirements}</p></>}
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: 15 }}>Posted by: {job.first_name} {job.last_name}</p>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 15, flexWrap: "wrap" }}>
        {user?.id !== job.posted_by && <button className="btn-primary" onClick={() => setShowApplyModal(true)}>Apply Now</button>}
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
  
  if (loading) return <div className="page-container"><div style={{ textAlign: "center", marginTop: "50px", color: "var(--text-muted)" }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading jobs...</p></div></div>;
  
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
    if (window.confirm("Remove this connection?")) { 
      try { 
        await axios.delete(`/api/connections/${connectionId}`); 
        toast.success("Connection removed"); 
        loadConnections(); 
      } catch (err) { toast.error("Failed to remove"); } 
    } 
  };
  
  const handleAccept = async (connectionId) => { 
    try { 
      await axios.post(`/api/connections/${connectionId}/accept`); 
      toast.success("Accepted!"); 
      loadConnections(); 
    } catch (err) { toast.error("Failed to accept"); } 
  };

  const handleReject = async (connectionId) => { 
    try { 
      await axios.delete(`/api/connections/${connectionId}/reject`); 
      toast.success("Rejected"); 
      loadConnections(); 
    } catch (err) { toast.error("Failed to reject"); } 
  };

  if (loading) return <div className="page-container"><div style={{ textAlign: "center", marginTop: "50px", color: "var(--text-muted)" }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading network...</p></div></div>;
  
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
  
  useEffect(() => { 
    if (targetUserId) { startChat(targetUserId); } else { loadInbox(); } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, loadInbox]);

  const startChat = async (otherUserId) => { try { const roomRes = await axios.post(`/api/messages/room/${otherUserId}`); setActiveRoom(roomRes.data.room); setChatPartner(roomRes.data.otherUser); fetchMessages(roomRes.data.room.id); } catch (err) { toast.error("Failed to start chat"); } };
  const fetchMessages = async (roomId) => { try { const res = await axios.get(`/api/messages/${roomId}`); setMessages(res.data.messages || []); } catch (err) { console.error(err); } };
  const sendMessage = async (e) => { e.preventDefault(); if (!newMessage.trim() || !activeRoom) return; try { await axios.post(`/api/messages/${activeRoom.id}`, { message: newMessage }); setNewMessage(""); fetchMessages(activeRoom.id); } catch (err) { toast.error("Failed to send message"); } };

  return (
    <div className="page-container"><Toaster />
      <div className="card" style={{ display: "flex", flexDirection: "column", height: "70vh", padding: 0, overflow: "hidden" }}>
        
        <div style={{ padding: "15px 20px", background: "var(--bg-color)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 15 }}>
          {activeRoom && <button onClick={() => { setActiveRoom(null); setChatPartner(null); loadInbox(); }} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}><i className="fas fa-arrow-left"></i> Back</button>}
          <h2 style={{ margin: 0, fontSize: "18px" }}>{chatPartner ? `Chat with ${chatPartner.first_name} ${chatPartner.last_name}` : "Messages Inbox"}</h2>
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
                  <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "5px", textAlign: isMe ? "right" : "left" }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              );
            })
          )}
        </div>

        {activeRoom && (
          <form onSubmit={sendMessage} style={{ display: "flex", padding: "15px", background: "var(--bg-color)", borderTop: "1px solid var(--border-color)" }}>
            <input type="text" className="input-box" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, borderRadius: "24px", marginBottom: 0 }} />
            <button type="submit" className="btn-primary" style={{ borderRadius: "50%", width: "45px", height: "45px", marginLeft: "10px", padding: 0 }}><i className="fas fa-paper-plane"></i></button>
          </form>
        )}
      </div>
    </div>
  );
};

// ==============================
// DASHBOARD, ADMIN & EDIT PROFILE
// ==============================
const DashboardPage = () => {
  const { user } = useAuth(); const [alumni, setAlumni] = useState([]); const [jobs, setJobs] = useState([]);
  useEffect(() => { const load = async () => { try { const [a, j] = await Promise.all([ axios.get("/api/users/directory?limit=10"), axios.get("/api/jobs") ]); setAlumni(a.data.users || []); setJobs(j.data.jobs || []); } catch (err) {} }; load(); }, []);
  return (
    <div className="page-container"><Toaster /><h1 style={{ marginBottom: "20px" }}>Dashboard Overview</h1>
      <div className="grid-3" style={{ marginBottom: 30 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}><div style={{ background: "#e0f2fe", color: "#2563eb", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}><i className="fas fa-users"></i></div><div><p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Registered Alumni</p><h2 style={{ margin: 0, fontSize: "28px" }}>{alumni.length}+</h2></div></div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}><div style={{ background: "#f3e8ff", color: "#7c3aed", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}><i className="fas fa-briefcase"></i></div><div><p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>Active Jobs</p><h2 style={{ margin: 0, fontSize: "28px" }}>{jobs.length}</h2></div></div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { user } = useAuth(); const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [searchTerm, setSearchTerm] = useState("");
  const fetchUsers = async (search = "") => { try { setLoading(true); const res = await axios.get(`/api/admin/users?search=${search}`); setUsers(res.data.users); } catch (err) { toast.error("Failed to load users"); } finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, []);
  const handleSearch = (e) => { e.preventDefault(); fetchUsers(searchTerm); };
  const handleToggleBan = async (targetUser) => { const action = targetUser.is_banned ? "unban" : "ban"; if (!window.confirm(`Are you sure you want to ${action} ${targetUser.first_name}?`)) return; try { await axios.patch(`/api/admin/users/${targetUser.id}/${action}`); toast.success(`User successfully ${action}ned`); fetchUsers(searchTerm); } catch (err) { toast.error("Failed"); } };
  const handleRoleChange = async (targetUser) => { const newRole = targetUser.role === 'admin' ? 'user' : 'admin'; if (!window.confirm(`Make ${targetUser.first_name} a ${newRole}?`)) return; try { await axios.patch(`/api/admin/users/${targetUser.id}/role`, { role: newRole }); toast.success(`Updated`); fetchUsers(searchTerm); } catch (err) { toast.error("Failed"); } };
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <div className="page-container"><Toaster />
      <div className="card">
        <h3>Manage Users</h3>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}><input type="text" className="input-box" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: 0, flex: 1 }} /><button type="submit" className="btn-primary">Search</button></form>
        {loading ? <p>Loading...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: "15px", borderBottom: "1px solid var(--border-color)", gap: "10px" }}>
                <div>
                  <strong>{u.first_name} {u.last_name}</strong> <span style={{ color: "var(--text-muted)", marginLeft: 10 }}>{u.email}</span>
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
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", headline: "", bio: "", location: "", currentCompany: "", collegeName: "" });
  useEffect(() => { if (user) setForm({ firstName: user.first_name||"", lastName: user.last_name||"", headline: user.headline||"", bio: user.bio||"", location: user.location||"", currentCompany: user.current_company||"", collegeName: user.college_name||"Chaibasa Engineering College" }); }, [user]);
  const submit = async (e) => { e.preventDefault(); try { await axios.put("/api/users/profile", form); toast.success("Updated!"); setTimeout(() => window.location.reload(), 1000); } catch (err) { toast.error("Failed to update"); } };
  return (
    <div className="page-container" style={{ maxWidth: 600 }}><Toaster />
      <div className="card"><h2>Edit Profile</h2>
        <form onSubmit={submit}>
          <div style={{ display: "flex", gap: "10px" }}><div style={{ flex: 1 }}><label>First Name</label><input className="input-box" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div><div style={{ flex: 1 }}><label>Last Name</label><input className="input-box" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div></div>
          <label>College Name</label><input className="input-box" value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} required />
          <label>Headline</label><input className="input-box" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          <label>Bio</label><textarea className="input-box" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <button className="btn-primary" style={{ width: "100%", marginTop: 15 }}>Save Changes</button>
        </form>
      </div>
    </div>
  );
};

const AlumniList = () => {
  const [alumni, setAlumni] = useState([]); const [loading, setLoading] = useState(true); const [searchTerm, setSearchTerm] = useState("");
  const loadAlumni = async (search = "") => { try { setLoading(true); const res = await axios.get(`/api/users/directory?search=${search}`); setAlumni(res.data.users || []); } catch (err) { toast.error("Failed to load alumni"); } finally { setLoading(false); } };
  useEffect(() => { loadAlumni(); }, []);
  const handleSearch = (e) => { e.preventDefault(); loadAlumni(searchTerm); };
  return (
    <div className="page-container"><Toaster /><h1>Alumni Directory</h1>
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}><input type="text" className="input-box" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: 0, flex: 1 }} /><button type="submit" className="btn-primary">Search</button></form>
      </div>
      {loading ? <p>Loading...</p> : (
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
// MAIN APP ROUTER
// ==============================
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          <Route path="/" element={<PrivateRoute><PrivateLayout><FeedPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><PrivateLayout><DashboardPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><PrivateLayout><AdminPanel /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni" element={<PrivateRoute><PrivateLayout><AlumniList /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni/:id" element={<PrivateRoute><PrivateLayout><AlumniProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/connections" element={<PrivateRoute><PrivateLayout><ConnectionsPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/profile/edit" element={<PrivateRoute><PrivateLayout><EditProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><PrivateLayout><MessagesPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><PrivateLayout><JobsPage /></PrivateLayout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
