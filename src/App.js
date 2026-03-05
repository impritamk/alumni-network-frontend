import "./styles.css";
import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
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
    console.log("🔐 Checking for token...");
    const token = localStorage.getItem("token");
    if (token) {
      console.log("✅ Token found, fetching user...");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      console.log("❌ No token found");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/api/auth/me");
      console.log("👤 User fetched:", res.data.user);
      setUser(res.data.user);
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log("🔑 Attempting login...");
    const res = await axios.post("/api/auth/login", { email, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(user);
    console.log("✅ Login successful:", user);
    return user;
  };

  const register = async (formData) => {
    console.log("📝 Attempting registration...");
    const res = await axios.post("/api/auth/register", formData);
    return res.data;
  };

  const logout = () => {
    console.log("👋 Logging out...");
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
// NAVBAR COMPONENT
// ==============================
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [indicators, setIndicators] = useState({ hasNewJobs: false, hasUnreadMessages: false });
  const [isDark, setIsDark] = useState(document.body.classList.contains("dark-mode")); 

  useEffect(() => {
    if (user) {
      const fetchIndicators = async () => {
        try {
          const res = await axios.get("/api/user/indicators");
          setIndicators(res.data);
        } catch (err) { }
      };
      fetchIndicators(); 
      const interval = setInterval(fetchIndicators, 60000); 
      return () => clearInterval(interval);
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
    <span style={{ position: "absolute", top: "-5px", right: "-10px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 0 2px #ffffff" }}></span>
  );

  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 30px", margin: "12px 16px", borderRadius: "12px", borderBottom: "none", minHeight: "60px", position: "relative" }}>
      
      <Link to="/" style={{ textDecoration: "none", fontSize: "22px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo-connectalumni.svg" alt="ConnectAlumni" style={{ width: "40px", height: "40px", filter: isDark ? "invert(1) brightness(2)" : "none", transition: "filter 0.3s ease" }} />
        <div style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: "-0.5px" }}>
          <span style={{ color: isDark ? "#f8fafc" : "#0f172a", transition: "color 0.3s ease" }}>Connect</span>
          <span style={{ color: "#2563eb" }}>Alumni</span>
        </div>
      </Link>
      
      <div className="navbar-desktop-menu" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Link to="/" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Feed</Link>
        <Link to="/dashboard" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Dashboard</Link>
        <Link to="/alumni" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Alumni</Link>
        <Link to="/connections" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Connections</Link>
        
        <Link to="/messages" onClick={() => setIndicators(prev => ({...prev, hasUnreadMessages: false}))} style={{ position: "relative", color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>
          Messages {indicators.hasUnreadMessages && <Dot />}
        </Link>

        <Link to="/jobs" onClick={() => setIndicators(prev => ({...prev, hasNewJobs: false}))} style={{ position: "relative", color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>
          Jobs {indicators.hasNewJobs && <Dot />}
        </Link>
        
        {user?.role === 'admin' && (
          <Link to="/admin" style={{ color: "#ef4444", fontWeight: "700", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#dc2626"} onMouseLeave={(e) => e.target.style.color = "#ef4444"}>Admin Panel</Link>
        )}

        <Link to="/profile/edit" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Profile</Link>
        
        <span style={{ color: "#6b7280", fontWeight: "500" }}>Hi, {user?.first_name || user?.firstName || "User"}</span>

        <button onClick={toggleDarkMode} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", marginLeft: "5px" }} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
          <i className={isDark ? "fas fa-sun" : "fas fa-moon"} style={{ color: isDark ? "#fbbf24" : "#6b7280" }}></i>
        </button>

        <button onClick={doLogout} style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "all 0.3s" }}>Logout</button>
      </div>

      <button className="navbar-hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#2563eb", padding: "8px", position: "relative" }}>
        {menuOpen ? "✕" : "☰"} {(indicators.hasNewJobs || indicators.hasUnreadMessages) && <Dot />}
      </button>

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>Feed</Link>
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/alumni" onClick={() => setMenuOpen(false)}>Alumni</Link>
          <Link to="/connections" onClick={() => setMenuOpen(false)}>Connections</Link>
          <Link to="/messages" onClick={() => { setMenuOpen(false); setIndicators(prev => ({...prev, hasUnreadMessages: false})) }}>Messages {indicators.hasUnreadMessages && "🔴"}</Link>
          <Link to="/jobs" onClick={() => { setMenuOpen(false); setIndicators(prev => ({...prev, hasNewJobs: false})) }}>Jobs {indicators.hasNewJobs && "🔴"}</Link>
          {user?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} style={{color: "#ef4444"}}>Admin Panel</Link>}
          <Link to="/profile/edit" onClick={() => setMenuOpen(false)}>Profile</Link>
          <button onClick={toggleDarkMode} style={{ background: "none", border: "none", color: "#6b7280", textAlign: "left", padding: "10px 0" }}>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
          <button onClick={() => { doLogout(); setMenuOpen(false); }}>Logout</button>
        </div>
      )}
    </div>
  );
};

// ==============================
// PRIVATE ROUTE & LAYOUT
// ==============================
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}><i className="fas fa-spinner fa-spin" style={{ color: "#2563eb", marginRight: "10px" }}></i> Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PrivateLayout = ({ children }) => {
  return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}><Navbar /><div className="app-content" style={{ flex: 1 }}>{children}</div></div>;
};

// ==============================
// LOGIN / REGISTER / OTP / RESET
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
            <input className="input-box" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} style={{ color: "#6b7280", fontSize: "16px" }}></i></button>
          </div>
          <button className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={isLoading}>{isLoading ? "Logging in..." : "Login"}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 15 }}>Don't have an account? <Link to="/register" className="text-blue">Register</Link> {" | "} <Link to="/forgot-password" className="text-blue">Forgot Password?</Link></p>
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", passoutYear: new Date().getFullYear() });
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match!"); return; }
    try {
      await register(form);
      localStorage.setItem("pendingEmail", form.email.toLowerCase().trim());
      toast.success("OTP sent! Verify your email.");
      window.location.href = "/verify-otp";
    } catch (err) { toast.error(err.response?.data?.message || "Registration failed"); }
  };

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Create Account</h2>
        <form onSubmit={submit}>
          <label>First Name</label>
          <input className="input-box" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <label>Last Name</label>
          <input className="input-box" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <label>Email</label>
          <input className="input-box" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <label>Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input-box" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} style={{ color: "#6b7280", fontSize: "16px" }}></i></button>
          </div>
          <label>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input-box" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }} />
          </div>
          <label>Passout Year</label>
          <input className="input-box" type="number" value={form.passoutYear} onChange={(e) => setForm({ ...form, passoutYear: e.target.value })} required />
          <button className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>Register</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 15 }}>Already have an account? <Link to="/login" className="text-blue">Login</Link></p>
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
    } else { setCanResend(true); }
  }, [countdown]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem("pendingEmail");
      if (!email) { toast.error("Email not found. Please register again."); navigate("/register"); return; }
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
    } catch (err) { toast.error(err.response?.data?.message || "Failed to resend OTP"); } 
    finally { setResending(false); }
  };

  const email = localStorage.getItem("pendingEmail");
  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Verify Email</h2>
        {email && <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20, background: "#f3f4f6", padding: "10px", borderRadius: "8px" }}>OTP sent to: <strong>{email}</strong></p>}
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20 }}>Enter the 6-digit OTP sent to your email</p>
        <form onSubmit={submit}>
          <label>OTP Code</label>
          <input className="input-box" type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required maxLength={6} placeholder="123456" style={{ textAlign: "center", fontSize: "24px", letterSpacing: "8px", fontWeight: "bold" }} />
          <button className="btn-primary" style={{ width: "100%", marginTop: 15 }}>Verify Email</button>
        </form>
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eee", textAlign: "center" }}>
          <p style={{ color: "#6b7280", marginBottom: 10 }}>Didn't receive the OTP?</p>
          <button onClick={handleResendOtp} disabled={!canResend || resending} style={{ background: canResend && !resending ? "#2563eb" : "#e5e7eb", color: canResend && !resending ? "white" : "#9ca3af", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: canResend && !resending ? "pointer" : "not-allowed", fontSize: "14px", fontWeight: "500" }}>{resending ? "Sending..." : countdown > 0 ? `Resend OTP (${countdown}s)` : "Resend OTP"}</button>
        </div>
      </div>
    </div>
  );
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Reset link sent!");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to send reset link"); setLoading(false); }
  };

  if (submitted) return (
    <div className="page-container" style={{ maxWidth: 450 }}><Toaster /><div className="card" style={{ marginTop: 60 }}><h2 className="heading" style={{ textAlign: "center" }}>Check Your Email</h2><p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20 }}>We've sent a password reset link to:<br/><strong>{email}</strong></p><button className="btn-primary" onClick={() => navigate("/login")} style={{ width: "100%", marginTop: 20 }}>Back to Login</button></div></div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Forgot Password?</h2>
        <form onSubmit={submit}>
          <label>Email</label>
          <input className="input-box" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} placeholder="your@email.com" />
          <button className="btn-primary" style={{ width: "100%" }} disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</button>
        </form>
      </div>
    </div>
  );
};

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match!"); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, password });
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to reset password"); setLoading(false); }
  };

  if (success) return (
    <div className="page-container" style={{ maxWidth: 450 }}><Toaster /><div className="card" style={{ marginTop: 60 }}><h2 className="heading" style={{ textAlign: "center", color: "#15803d" }}>✅ Success!</h2><p style={{ textAlign: "center", color: "#6b7280" }}>Redirecting to login...</p></div></div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Reset Password</h2>
        <form onSubmit={submit}>
          <label>New Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input-box" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} style={{ color: "#6b7280", fontSize: "16px" }}></i></button>
          </div>
          <label>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input-box" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }} />
          </div>
          <button className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
        </form>
      </div>
    </div>
  );
};

// ==============================
// POST COMPONENT (INDIVIDUAL)
// ==============================
const PostItem = ({ post, user, onDelete, onRefresh }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await axios.post(`/api/posts/${post.id}/like`);
      onRefresh(); // Refresh to get updated count and status
    } catch (err) {
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await axios.post(`/api/posts/${post.id}/comments`, { content: commentText });
      setCommentText("");
      onRefresh();
    } catch (err) {
      toast.error("Failed to post comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`/api/posts/comments/${commentId}`);
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="card" style={{ marginBottom: "15px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h4 style={{ margin: "0 0 5px 0", color: "inherit", display: "flex", alignItems: "center", gap: "8px" }}>
            {post.first_name} {post.last_name}
            {post.role === 'admin' && <span style={{ background: "#fef2f2", color: "#dc2626", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold" }}>ADMIN</span>}
          </h4>
          <p style={{ margin: "0 0 15px 0", fontSize: "12px", color: "#94a3b8" }}>
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
        {(user?.role === 'admin' || user?.id === post.user_id) && (
          <button onClick={() => onDelete(post.id)} className="btn-danger" style={{ padding: "4px 10px", fontSize: "12px" }}>
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
      <p style={{ margin: "0 0 15px 0", whiteSpace: "pre-wrap", lineHeight: 1.5, color: "inherit" }}>{post.content}</p>
      
      {/* Interaction Bar */}
      <div style={{ display: "flex", gap: "15px", borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
        <button 
          onClick={handleLike} 
          disabled={isLiking}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: post.user_liked ? "#ef4444" : "#64748b", fontWeight: "bold", fontSize: "14px" }}
        >
          <i className={post.user_liked ? "fas fa-heart" : "far fa-heart"}></i> {post.like_count || 0} Likes
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontWeight: "bold", fontSize: "14px" }}
        >
          <i className="far fa-comment"></i> {post.comments?.length || 0} Comments
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{ marginTop: "15px", background: "rgba(0,0,0,0.03)", padding: "15px", borderRadius: "8px" }}>
          
          <form onSubmit={handleComment} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input 
              type="text" 
              className="input-box" 
              placeholder="Write a comment..." 
              value={commentText} 
              onChange={(e) => setCommentText(e.target.value)} 
              style={{ marginBottom: 0, flex: 1 }} 
            />
            <button type="submit" className="btn-primary" disabled={!commentText.trim()}>Post</button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {post.comments && post.comments.length > 0 ? (
              post.comments.map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", background: "var(--card-bg, #fff)", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <strong style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" }}>
                      {c.first_name} {c.last_name}
                      {c.role === 'admin' && <span style={{ color: "#dc2626", fontSize: "10px" }}>(Admin)</span>}
                    </strong>
                    <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "5px" }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    <p style={{ margin: 0, fontSize: "14px" }}>{c.content}</p>
                  </div>
                  {(user?.role === 'admin' || user?.id === c.user_id) && (
                    <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", alignSelf: "flex-start", padding: "5px" }}>
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>No comments yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==============================
// COMMUNITY FEED (HOMEPAGE)
// ==============================
const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get("/api/posts");
      setPosts(res.data.posts);
    } catch (err) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/posts", { content });
      setContent("");
      fetchPosts();
      toast.success("Post created!");
    } catch (err) {
      toast.error("Failed to create post");
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(p => p.id !== postId));
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
    }
  };

  if (loading) return <div className="page-container"><p style={{ textAlign: "center" }}>Loading feed...</p></div>;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Toaster />
      
      {/* Welcome Banner moved here */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>Welcome back, {user?.first_name || "Alumni"}! 👋</h1>
          <p style={{ margin: 0, color: "#64748b" }}>Here is what's happening in your community today.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/alumni" className="btn-secondary" style={{ textDecoration: "none" }}>
            <i className="fas fa-search" style={{ marginRight: 5 }}></i> Find Alumni
          </Link>
          <Link to="/jobs" className="btn-primary" style={{ textDecoration: "none" }}>
            <i className="fas fa-briefcase" style={{ marginRight: 5 }}></i> View Jobs
          </Link>
        </div>
      </div>
      
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <textarea
            className="input-box"
            rows="3"
            placeholder="Share an update, ask a question, or post an opportunity..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" style={{ padding: "10px 24px", marginTop: 10 }}>
              <i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i> Post
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {posts.map(post => (
          <PostItem key={post.id} post={post} user={user} onDelete={handleDelete} onRefresh={fetchPosts} />
        ))}
        {posts.length === 0 && <p style={{ textAlign: "center", color: "#6b7280", marginTop: "20px" }}>No posts yet. Be the first to break the ice!</p>}
      </div>
    </div>
  );
};

// ==============================
// ADMIN PANEL
// ==============================
const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async (search = "") => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/users?search=${search}`);
      setUsers(res.data.users);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchTerm);
  };

  const handleToggleBan = async (targetUser) => {
    const action = targetUser.is_banned ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${action} ${targetUser.first_name}?`)) return;

    try {
      await axios.patch(`/api/admin/users/${targetUser.id}/${action}`);
      toast.success(`User successfully ${action}ned`);
      fetchUsers(searchTerm);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleRoleChange = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to make ${targetUser.first_name} a ${newRole}?`)) return;
  
    try {
      await axios.patch(`/api/admin/users/${targetUser.id}/role`, { role: newRole });
      toast.success(`User is now an ${newRole}`);
      fetchUsers(searchTerm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-container">
      <Toaster />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <i className="fas fa-shield-alt" style={{ fontSize: "28px", color: "#dc2626" }}></i>
        <h1 style={{ margin: 0 }}>Admin Panel</h1>
      </div>
      
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Manage Users</h3>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            className="input-box"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 0, flex: 1 }}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading users...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map(u => (
              <div key={u.id} style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                justifyContent: "space-between", 
                alignItems: "center", 
                padding: "15px", 
                borderBottom: "1px solid #e2e8f0", 
                background: u.is_banned ? "rgba(220,38,38,0.1)" : "transparent",
                gap: "10px"
              }}>
                <div style={{ flex: "1 1 auto", minWidth: "200px" }}>
                  {/* FIXED BUG: Color set to 'inherit' instead of #0f172a to work in dark mode */}
                  <strong style={{ fontSize: "16px", color: u.is_banned ? "#ef4444" : "inherit" }}>
                    {u.first_name} {u.last_name}
                  </strong>
                  <span style={{ color: "#64748b", marginLeft: 10 }}>{u.email}</span>
                  <div style={{ marginTop: "5px" }}>
                    <span style={{ 
                      fontSize: "12px", 
                      fontWeight: "bold",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      background: u.is_banned ? "#fecaca" : "#dcfce7",
                      color: u.is_banned ? "#b91c1c" : "#15803d" 
                    }}>
                      {u.is_banned ? "Banned" : "Active"}
                    </span>
                    {u.role === 'admin' && <span style={{ marginLeft: 10, fontSize: "12px", color: "#6b7280", fontWeight: "bold" }}><i className="fas fa-star" style={{color:"#fbbf24"}}></i> Admin</span>}
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {u.id !== user.id && (
                    <button
                      onClick={() => handleRoleChange(u)}
                      className="btn-primary"
                      style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "bold", background: u.role === 'admin' ? "#64748b" : "#2563eb", border: "none" }}
                    >
                      <i className="fas fa-user-shield" style={{ marginRight: 6 }}></i>
                      {u.role === 'admin' ? "Remove Admin" : "Make Admin"}
                    </button>
                  )}
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleBan(u)}
                      className={u.is_banned ? "btn-secondary" : "btn-danger"}
                      style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "bold" }}
                    >
                      <i className={`fas ${u.is_banned ? "fa-unlock" : "fa-ban"}`} style={{ marginRight: 6 }}></i>
                      {u.is_banned ? "Unban User" : "Ban User"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && <p style={{textAlign:"center"}}>No users found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

// ==============================
// DASHBOARD
// ==============================
const DashboardPage = () => {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [a, j] = await Promise.all([
          axios.get("/api/users/directory?limit=10"),
          axios.get("/api/jobs"),
        ]);
        setAlumni(a.data.users || []);
        setJobs(j.data.jobs || []);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    
    load();
  }, []);

  return (
    <div className="page-container">
      <Toaster />
      <h1 style={{ marginBottom: "20px" }}>Dashboard Overview</h1>
      
      <div className="grid-3" style={{ marginBottom: 30 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#e0f2fe", color: "#2563eb", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
            <i className="fas fa-users"></i>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Registered Alumni</p>
            <h2 style={{ margin: 0, fontSize: "28px" }}>{alumni.length}+</h2>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#f3e8ff", color: "#7c3aed", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
            <i className="fas fa-briefcase"></i>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Active Job Postings</p>
            <h2 style={{ margin: 0, fontSize: "28px" }}>{jobs.length}</h2>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#dcfce7", color: "#15803d", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
            <i className="fas fa-id-badge"></i>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Your Profile</p>
            <h3 style={{ margin: "2px 0", fontSize: "16px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>
              {user?.headline || "Headline not set"}
            </h3>
            <Link className="text-blue" to="/profile/edit" style={{ fontSize: "13px" }}>Edit Profile →</Link>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}><i className="fas fa-user-plus" style={{ marginRight: 8, color: "#64748b" }}></i> Newest Members</h2>
            <Link to="/alumni" className="text-blue" style={{ fontSize: "14px" }}>View All</Link>
          </div>
          
          {alumni.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px 0" }}>No alumni found</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {alumni.slice(0, 5).map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px" }}>{p.first_name} {p.last_name}</h4>
                      <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>Batch of {p.passout_year}</p>
                    </div>
                  </div>
                  <Link to={`/alumni/${p.id}`} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", textDecoration: "none" }}>
                    Profile
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}><i className="fas fa-bullhorn" style={{ marginRight: 8, color: "#64748b" }}></i> Latest Jobs</h2>
            <Link to="/jobs" className="text-blue" style={{ fontSize: "14px" }}>Job Board</Link>
          </div>

          {jobs.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px 0" }}>No jobs found</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px" }}>{job.title}</h4>
                    <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>{job.company} • {job.location || "Remote"}</p>
                  </div>
                  <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                    {job.job_type || "Full-time"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==============================
// ALUMNI LIST
// ==============================
const AlumniList = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const loadAlumni = async (search = "", year = "") => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/users/directory?search=${search}&passoutYear=${year}`);
      setAlumni(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load alumni");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumni();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAlumni(searchTerm, filterYear);
  };

  return (
    <div className="page-container">
      <Toaster />
      <h1>Alumni Directory</h1>
      
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 200px" }}>
            <input
              type="text"
              className="input-box"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ flex: "0 1 150px" }}>
            <input
              type="number"
              className="input-box"
              placeholder="Passout Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: "10px 20px" }}>Search</button>
        </form>
      </div>

      <p style={{ color: "#6b7280", marginBottom: 20 }}>Total found: {alumni.length}</p>
      
      {loading ? (
        <div style={{ textAlign: "center", marginTop: "50px", color: "#6b7280" }}>
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p>Loading alumni...</p>
        </div>
      ) : (
        <div className="grid-3">
          {alumni.length === 0 ? (
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <p style={{ textAlign: "center" }}>No alumni found</p>
            </div>
          ) : (
            alumni.map((person) => (
              <div key={person.id} className="card">
                <h3 style={{ marginTop: 0 }}>
                  {person.first_name} {person.last_name}
                </h3>
                <p style={{ color: "#6b7280" }}>{person.headline || "Alumni"}</p>
                <p><strong>Batch:</strong> {person.passout_year}</p>
                <Link to={`/alumni/${person.id}`} className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                  View Profile
                </Link>
              </div>
            ))
          )}
        </div>
      )}
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
      } catch (err) {
        console.error("Failed to check connection status");
      } finally {
        setLoading(false);
      }
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

  if (status === "accepted") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" onClick={handleMessage}><i className="fas fa-comment-dots" style={{ marginRight: 5 }}></i> Message</button>
        <button className="btn-danger" onClick={handleRemove}><i className="fas fa-times" style={{ marginRight: 5 }}></i> Disconnect</button>
      </div>
    );
  }

  if (status === "pending") return <button className="btn-secondary" disabled><i className="fas fa-hourglass-half" style={{ marginRight: 5 }}></i> Request Pending</button>;

  return <button className="btn-primary" onClick={handleConnect} disabled={loading}><i className="fas fa-user-plus" style={{ marginRight: 5 }}></i> Connect</button>;
};

// ==============================
// ALUMNI PROFILE
// ==============================
const AlumniProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true); setError(null);
      try {
        const res = await axios.get(`/api/users/${id}`);
        setUser(res.data.user);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load user profile");
      } finally { setLoading(false); }
    };
    fetchUser();
  }, [id]);

  if (loading) return <div className="page-container"><div className="card" style={{ textAlign: "center", color: "#6b7280" }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading profile...</p></div></div>;

  if (error || !user) return (
    <div className="page-container">
      <Toaster />
      <div className="card" style={{ textAlign: "center" }}>
        <h2><i className="fas fa-user-slash" style={{ color: "#ef4444", marginRight: 10 }}></i>User Not Found</h2>
        <p style={{ color: "#6b7280", marginBottom: 15 }}>{error || "This user profile could not be found."}</p>
        <Link to="/alumni" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>Back to Alumni List</Link>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <Toaster />
      <div className="card">
        <h2>{user.first_name} {user.last_name}</h2>
        <p style={{ color: "#6b7280", fontSize: "18px", marginTop: 5 }}>{user.headline || "Alumni"}</p>
        
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eee" }}>
          <p><b><i className="fas fa-graduation-cap" style={{ color: "#2563eb", width: 20 }}></i> Batch:</b> {user.passout_year || "N/A"}</p>
          {user.email && <p><b><i className="fas fa-envelope" style={{ color: "#2563eb", width: 20 }}></i> Email:</b> {user.email}</p>}
          {user.current_company && <p><b><i className="fas fa-building" style={{ color: "#2563eb", width: 20 }}></i> Company:</b> {user.current_company}</p>}
          {user.location && <p><b><i className="fas fa-map-marker-alt" style={{ color: "#2563eb", width: 20 }}></i> Location:</b> {user.location}</p>}
        </div>
        
        {user.bio && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eee" }}>
            <h3 style={{ marginTop: 0 }}>About</h3>
            <p style={{ color: "#4b5563", lineHeight: 1.6 }}>{user.bio}</p>
          </div>
        )}
        
        <div style={{ marginTop: 25, display: "flex", gap: 10 }}><ConnectButton userId={id} /></div>
      </div>
      <Link to="/alumni" className="text-blue" style={{ display: "inline-block", marginTop: 20, fontSize: "16px" }}>← Back to Alumni List</Link>
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
      const [connRes, pendRes] = await Promise.all([
        axios.get("/api/connections?status=accepted"),
        axios.get("/api/connections/pending-requests")
      ]);
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
      } catch (err) { toast.error("Failed to remove connection"); }
    }
  };

  const handleAccept = async (connectionId) => {
    try {
      await axios.post(`/api/connections/${connectionId}/accept`);
      toast.success("Connection accepted!");
      loadConnections();
    } catch (err) { toast.error("Failed to accept connection"); }
  };

  const handleReject = async (connectionId) => {
    try {
      await axios.delete(`/api/connections/${connectionId}/reject`);
      toast.success("Connection rejected");
      loadConnections();
    } catch (err) { toast.error("Failed to reject connection"); }
  };

  if (loading) return <div className="page-container"><div style={{ textAlign: "center", marginTop: "50px", color: "#6b7280" }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading network...</p></div></div>;

  return (
    <div className="page-container">
      <Toaster />
      <h1>My Network</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "2px solid #e5e7eb" }}>
        <button onClick={() => setTab("connections")} style={{ background: "none", border: "none", padding: "12px 0", fontSize: "16px", fontWeight: tab === "connections" ? "700" : "500", color: tab === "connections" ? "#2563eb" : "#6b7280", borderBottom: tab === "connections" ? "3px solid #2563eb" : "none", cursor: "pointer" }}>Connections ({connections.length})</button>
        <button onClick={() => setTab("pending")} style={{ background: "none", border: "none", padding: "12px 0", fontSize: "16px", fontWeight: tab === "pending" ? "700" : "500", color: tab === "pending" ? "#2563eb" : "#6b7280", borderBottom: tab === "pending" ? "3px solid #2563eb" : "none", cursor: "pointer" }}>Pending ({pending.length})</button>
      </div>

      {tab === "connections" && (
        <div>
          {connections.length === 0 ? (
            <div className="card"><p style={{ textAlign: "center", color: "#6b7280" }}>No connections yet. Start connecting with alumni!</p></div>
          ) : (
            <div className="grid-3">
              {connections.map((conn) => (
                <div key={conn.connection_id} className="card">
                  <h3 style={{ marginTop: 0 }}>{conn.first_name} {conn.last_name}</h3>
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>{conn.headline || "Alumni"}</p>
                  <p style={{ fontSize: "13px", color: "#9ca3af" }}>Batch {conn.passout_year}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn-secondary" onClick={() => window.location.href = `/alumni/${conn.id}`} style={{ flex: 1, fontSize: "13px", padding: "6px" }}>View Profile</button>
                    <button className="btn-danger" onClick={() => handleRemoveConnection(conn.connected_to)} style={{ flex: 1, fontSize: "13px", padding: "6px" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "pending" && (
        <div>
          {pending.length === 0 ? (
            <div className="card"><p style={{ textAlign: "center", color: "#6b7280" }}>No pending connection requests</p></div>
          ) : (
            <div className="grid-2">
              {pending.map((req) => (
                <div key={req.connection_id} className="card" style={{ background: "#f0f4ff" }}>
                  <h3 style={{ marginTop: 0, color: "#2563eb" }}>{req.first_name} {req.last_name}</h3>
                  <p style={{ color: "#6b7280", fontSize: "14px" }}>{req.headline || "Alumni"}</p>
                  <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: 15 }}>Batch {req.passout_year}</p>
                  <div style={{ display: "flex", gap: 8 }}>
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
// EDIT PROFILE
// ==============================
const EditProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", headline: "", bio: "", location: "", currentCompany: "" });

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.first_name || "", lastName: user.last_name || "", headline: user.headline || "", bio: user.bio || "", location: user.location || "", currentCompany: user.current_company || "" });
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/users/profile", form);
      toast.success("Profile updated successfully!");
      setTimeout(() => window.location.reload(), 1000); 
    } catch (err) { toast.error("Failed to update profile"); }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;
    const doubleConfirm = window.confirm("Type 'DELETE' in your mind - this will permanently delete all your data including jobs, applications, and profile.");
    if (!doubleConfirm) return;

    try {
      await axios.delete("/api/users/account");
      toast.success("Account deleted successfully!");
      logout();
      navigate("/login");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete account"); }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <Toaster />
      <div className="card">
        <h2>Edit Profile</h2>
        <form onSubmit={submit}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}><label>First Name</label><input className="input-box" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Last Name</label><input className="input-box" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div>
          </div>
          <label>Headline</label><input className="input-box" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Software Engineer at Google" />
          <label>Bio</label><textarea className="input-box" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <label>Location</label><input className="input-box" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. New York, NY" />
          <label>Company</label><input className="input-box" value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} />
          <button className="btn-primary" style={{ width: "100%", marginTop: 15 }}>Save Changes</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20, background: "#fee2e2", border: "1px solid #fca5a5" }}>
        <h3 style={{ marginTop: 0, color: "#dc2626" }}>Danger Zone</h3>
        <p style={{ color: "#991b1b", marginBottom: 15 }}>Permanently delete your account and all associated data.</p>
        <button className="btn-danger" onClick={handleDeleteAccount} style={{ width: "100%" }}><i className="fas fa-trash-alt" style={{ marginRight: 5 }}></i> Delete My Account</button>
      </div>
    </div>
  );
};

// ==============================
// CREATE JOB MODAL
// ==============================
const CreateJobModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ title: "", company: "", description: "", requirements: "", location: "", salaryRange: "", jobType: "Full-time", experienceLevel: "Mid-level" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/jobs", form);
      toast.success("Job posted successfully!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post job");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div className="card" style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Post a Job</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Job Title *</label><input className="input-box" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Senior Software Engineer" />
          <label>Company *</label><input className="input-box" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required placeholder="e.g. Tech Corp" />
          <label>Location</label><input className="input-box" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Remote, New York, etc." />
          <label>Job Type *</label>
          <select className="input-box" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} required>
            <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Internship">Internship</option>
          </select>
          <label>Experience Level *</label>
          <select className="input-box" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} required>
            <option value="Entry-level">Entry-level</option><option value="Mid-level">Mid-level</option><option value="Senior">Senior</option><option value="Lead">Lead</option><option value="Executive">Executive</option>
          </select>
          <label>Salary Range</label><input className="input-box" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} placeholder="e.g. $80K - $120K" />
          <label>Job Description *</label><textarea className="input-box" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Describe the role..." />
          <label>Requirements</label><textarea className="input-box" rows={4} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="List the required skills..." />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? "Posting..." : "Post Job"}</button>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==============================
// APPLY JOB MODAL
// ==============================
const ApplyJobModal = ({ job, onClose, onSuccess }) => {
  const [form, setForm] = useState({ coverLetter: "", resume: "", phone: "", linkedinUrl: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/api/jobs/${job.id}/apply`, form);
      toast.success("Application submitted successfully!");
      onSuccess();
    } catch (err) {
      if (err.response?.status === 409) { toast.error("You have already applied to this job"); } 
      else { toast.error(err.response?.data?.message || "Failed to submit application"); }
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div className="card" style={{ maxWidth: 500, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2 style={{ margin: 0 }}>Apply for {job.title}</h2><p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>at {job.company}</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Cover Letter</label><textarea className="input-box" rows={5} value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} placeholder="Why are you a great fit for this role?" />
          <label>Resume Link (Google Drive, Dropbox, etc.)</label><input className="input-box" type="url" value={form.resume} onChange={(e) => setForm({ ...form, resume: e.target.value })} placeholder="https://" />
          <label>Phone Number</label><input className="input-box" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" />
          <label>LinkedIn Profile URL</label><input className="input-box" type="url" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/yourprofile" />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? "Submitting..." : "Submit Application"}</button>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==============================
// VIEW APPLICATIONS MODAL
// ==============================
const ViewApplicationsModal = ({ job, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await axios.get(`/api/jobs/${job.id}/applications`);
        setApplications(res.data.applications || []);
      } catch (err) { toast.error("Failed to load applications"); } 
      finally { setLoading(false); }
    };
    fetchApplications();
  }, [job.id]);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div className="card" style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto", background: "#f8fafc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2 style={{ margin: 0 }}>Applicants for {job.title}</h2><p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Total: {applications.length}</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280" }}>×</button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading applications...</p></div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}><i className="fas fa-folder-open fa-2x" style={{ marginBottom: 10 }}></i><p>No applications received yet.</p></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {applications.map((app) => (
              <div key={app.id} style={{ background: "white", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 5px 0", color: "#0f172a" }}>{app.first_name} {app.last_name}</h3>
                <p style={{ margin: "0 0 10px 0", color: "#64748b", fontSize: "14px" }}>{app.email} • {app.headline || "Alumni"}</p>
                <div style={{ background: "#f1f5f9", padding: "10px", borderRadius: "6px", fontSize: "14px", color: "#334155", whiteSpace: "pre-wrap", marginBottom: "10px" }}>{app.cover_letter || "No cover letter provided."}</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {app.resume_url && (
                    <a href={app.resume_url} target="_blank" rel="noreferrer" style={{ background: "#e0f2fe", color: "#0369a1", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}><i className="fas fa-file-alt" style={{ marginRight: 4 }}></i> View Resume</a>
                  )}
                  <Link to={`/alumni/${app.applicant_id}`} style={{ background: "#f3e8ff", color: "#7c3aed", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}><i className="fas fa-user" style={{ marginRight: 4 }}></i> View Profile</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==============================
// JOB CARD
// ==============================
const JobCard = ({ job, onJobDeleted }) => {
  const [expanded, setExpanded] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false); 
  const [showApplicationsModal, setShowApplicationsModal] = useState(false); 
  const { user } = useAuth();

  const handleDeleteJob = async () => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.delete(`/api/jobs/${job.id}`);
        toast.success("Job deleted!");
        if (onJobDeleted) onJobDeleted();
      } catch (err) { toast.error(err.response?.data?.message || "Failed to delete job"); }
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0, marginBottom: 5 }}>{job.title}</h3>
          <p style={{ color: "#6b7280", marginBottom: 10, fontSize: "16px" }}><strong>{job.company}</strong>{job.location && ` • ${job.location}`}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {job.job_type && <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}><i className="fas fa-briefcase" style={{ marginRight: 4 }}></i> {job.job_type}</span>}
            {job.experience_level && <span style={{ background: "#f3e8ff", color: "#7c3aed", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}><i className="fas fa-chart-line" style={{ marginRight: 4 }}></i> {job.experience_level}</span>}
            {job.salary_range && <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}><i className="fas fa-money-bill-wave" style={{ marginRight: 4 }}></i> {job.salary_range}</span>}
          </div>
          {expanded && (
            <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid #eee" }}>
              <h4 style={{ marginTop: 0 }}>Description</h4><p style={{ color: "#4b5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.description}</p>
              {job.requirements && <><h4 style={{ marginTop: 15 }}>Requirements</h4><p style={{ color: "#4b5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.requirements}</p></>}
              <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 15 }}>Posted by: {job.first_name} {job.last_name}</p>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 15, flexWrap: "wrap" }}>
        {user?.id !== job.posted_by && <button className="btn-primary" onClick={() => setShowApplyModal(true)}><i className="fas fa-paper-plane" style={{ marginRight: 5 }}></i> Apply Now</button>}
        <button className="btn-secondary" onClick={() => setExpanded(!expanded)}>{expanded ? <><i className="fas fa-chevron-up"></i> Show Less</> : <><i className="fas fa-chevron-down"></i> View Details</>}</button>
        {user?.id === job.posted_by && <button className="btn-primary" onClick={() => setShowApplicationsModal(true)}><i className="fas fa-users" style={{ marginRight: 5 }}></i> View Applications ({job.application_count || 0})</button>}
        {(user?.id === job.posted_by || user?.role === 'admin') && <button className="btn-danger" onClick={handleDeleteJob}><i className="fas fa-trash" style={{ marginRight: 5 }}></i> Delete Job</button>}
      </div>
      {showApplyModal && <ApplyJobModal job={job} onClose={() => setShowApplyModal(false)} onSuccess={() => { setShowApplyModal(false); if(onJobDeleted) onJobDeleted(); }} />}
      {showApplicationsModal && <ViewApplicationsModal job={job} onClose={() => setShowApplicationsModal(false)} />}
    </div>
  );
};

// ==============================
// JOBS PAGE
// ==============================
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

  if (loading) return <div className="page-container"><div style={{ textAlign: "center", marginTop: "50px", color: "#6b7280" }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading jobs...</p></div></div>;

  return (
    <div className="page-container">
      <Toaster />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Job Board</h1><button className="btn-primary" onClick={() => setShowCreateModal(true)}><i className="fas fa-plus" style={{ marginRight: 5 }}></i> Post a Job</button>
      </div>
      {showCreateModal && <CreateJobModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadJobs(); }} />}
      {jobs.length === 0 ? (
        <div className="card"><p style={{ textAlign: "center", color: "#6b7280" }}>No jobs posted yet. Be the first to post a job!</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>{jobs.map((job) => <JobCard key={job.id} job={job} onJobDeleted={loadJobs} />)}</div>
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
    } catch (err) { console.error("Failed to load inbox", err); }
  }, []);

  useEffect(() => {
    if (targetUserId) { startChat(targetUserId); } 
    else { loadInbox(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, loadInbox]);

  const startChat = async (otherUserId) => {
    try {
      const roomRes = await axios.post(`/api/messages/room/${otherUserId}`);
      setActiveRoom(roomRes.data.room);
      setChatPartner(roomRes.data.otherUser);
      fetchMessages(roomRes.data.room.id);
    } catch (err) { toast.error("Failed to start chat"); }
  };

  const fetchMessages = async (roomId) => {
    try {
      const res = await axios.get(`/api/messages/${roomId}`);
      setMessages(res.data.messages || []);
    } catch (err) { console.error(err); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;
    try {
      await axios.post(`/api/messages/${activeRoom.id}`, { message: newMessage });
      setNewMessage("");
      fetchMessages(activeRoom.id); 
    } catch (err) { toast.error("Failed to send message"); }
  };

  return (
    <div className="page-container">
      <Toaster />
      <div className="card" style={{ display: "flex", flexDirection: "column", height: "70vh", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "15px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 15 }}>
          {activeRoom && (
            <button onClick={() => { setActiveRoom(null); setChatPartner(null); loadInbox(); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}><i className="fas fa-arrow-left"></i> Back</button>
          )}
          <h2 style={{ margin: 0, fontSize: "18px" }}>{chatPartner ? `Chat with ${chatPartner.first_name} ${chatPartner.last_name}` : "Messages Inbox"}</h2>
        </div>

        <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", background: "#ffffff" }}>
          {!activeRoom ? (
            inbox.length === 0 ? (
              <div style={{ margin: "auto", color: "#94a3b8", textAlign: "center" }}><i className="fas fa-inbox fa-3x" style={{ marginBottom: 10, color: "#cbd5e1" }}></i><p>Your inbox is empty. Go to an Alumni Profile to start chatting!</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {inbox.map((item) => (
                  <div key={item.room.id} onClick={() => startChat(item.otherUser.id)} style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px", border: "1px solid #e2e8f0", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                     <div style={{ width: 45, height: 45, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold" }}>{item.otherUser.first_name[0]}{item.otherUser.last_name[0]}</div>
                     <div>
                       <h4 style={{ margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>{item.otherUser.first_name} {item.otherUser.last_name}{item.hasUnread && <span style={{ width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>}</h4>
                       <p style={{ margin: 0, fontSize: "13px", color: item.hasUnread ? "#ef4444" : "#64748b", fontWeight: item.hasUnread ? "bold" : "normal" }}>{item.hasUnread ? "New message!" : "Click to open chat"}</p>
                     </div>
                  </div>
                ))}
              </div>
            )
          ) : messages.length === 0 ? (
            <div style={{ margin: "auto", color: "#94a3b8", textAlign: "center" }}><i className="fas fa-comments fa-3x" style={{ marginBottom: 10, color: "#cbd5e1" }}></i><p>No messages yet. Say hi! 👋</p></div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", background: isMe ? "#2563eb" : "#f1f5f9", color: isMe ? "white" : "#0f172a", padding: "10px 15px", borderRadius: "18px", maxWidth: "70%", borderBottomRightRadius: isMe ? "4px" : "18px", borderBottomLeftRadius: !isMe ? "4px" : "18px" }}>
                  <div style={{ fontSize: "15px", wordBreak: "break-word" }}>{msg.message}</div>
                  <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "5px", textAlign: isMe ? "right" : "left" }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              );
            })
          )}
        </div>

        {activeRoom && (
          <form onSubmit={sendMessage} style={{ display: "flex", padding: "15px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: "12px 15px", borderRadius: "24px", border: "1px solid #cbd5e1", outline: "none" }} />
            <button type="submit" className="btn-primary" style={{ borderRadius: "50%", width: "45px", height: "45px", marginLeft: "10px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fas fa-paper-plane"></i></button>
          </form>
        )}
      </div>
    </div>
  );
};

// ==============================
// MAIN APP
// ==============================
function App() {
  console.log("🚀 App component rendering");
  
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
