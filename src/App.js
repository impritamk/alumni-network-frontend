import "./styles.css";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useParams
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
  console.log("🎨 Navbar rendering");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 30px",
      margin: "12px 16px",
      borderRadius: "12px",
      borderBottom: "none",
      background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
      boxShadow: "0 4px 16px rgba(37, 99, 235, 0.1)",
      minHeight: "60px",
      position: "relative",
      border: "1px solid #e0e7ff"
    }}>
      <Link to="/" style={{ textDecoration: "none", color: "#2563eb", fontSize: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo-connectalumni.svg" alt="ConnectAlumni" style={{ width: "40px", height: "40px" }} />
        <span style={{ fontFamily: "'Poppins', sans-serif" }}>ConnectAlumni</span>
      </Link>
      
      {/* Desktop Menu */}
      <div className="navbar-desktop-menu" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Link to="/" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Home</Link>
        <Link to="/alumni" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Alumni</Link>
        <Link to="/messages" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Messages</Link>
        <Link to="/jobs" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Jobs</Link>
        <Link to="/profile/edit" style={{ color: "#6b7280", fontWeight: "500", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={(e) => e.target.style.color = "#2563eb"} onMouseLeave={(e) => e.target.style.color = "#6b7280"}>Profile</Link>
        <span style={{ color: "#6b7280", fontWeight: "500" }}>
          Hi, {user?.first_name || user?.firstName || "User"}
        </span>
        <button 
          onClick={doLogout}
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.3s"
          }}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          Logout
        </button>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        className="navbar-hamburger-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          background: "none",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          color: "#2563eb",
          padding: "8px"
        }}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/alumni" onClick={() => setMenuOpen(false)}>Alumni</Link>
          <Link to="/messages" onClick={() => setMenuOpen(false)}>Messages</Link>
          <Link to="/jobs" onClick={() => setMenuOpen(false)}>Jobs</Link>
          <Link to="/profile/edit" onClick={() => setMenuOpen(false)}>Profile</Link>
          <button 
            onClick={() => { doLogout(); setMenuOpen(false); }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

// ==============================
// PRIVATE ROUTE
// ==============================
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '20px'
      }}>
        Loading...
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// ==============================
// PRIVATE LAYOUT
// ==============================
const PrivateLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="app-content" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

// ==============================
// LOGIN PAGE
// ==============================
const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Login successful!");
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
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
          <input
            className="input-box"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <label>Password</label>
          <input
            className="input-box"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button 
            className="btn-primary" 
            style={{ width: "100%" }}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 10 }}>
          Don't have an account?{" "}
          <Link to="/register" className="text-blue">Register</Link>
            {" | "}
          <Link to="/forgot-password" className="text-blue">Forgot Password?</Link>

        </p>
      </div>
    </div>
  );
};

// ==============================
// REGISTER PAGE
// ==============================
const RegisterPage = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    passoutYear: new Date().getFullYear(),
  });

  const submit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        passoutYear: form.passoutYear
      });
      localStorage.setItem("pendingEmail", form.email);
      toast.success("OTP sent! Verify your email.");
      window.location.href = "/verify-otp";
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Create Account</h2>
        <form onSubmit={submit}>
          <label>First Name</label>
          <input
            className="input-box"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
          <label>Last Name</label>
          <input
            className="input-box"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
          <label>Email</label>
          <input
            className="input-box"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <label>Password</label>
          <input
            className="input-box"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <label>Confirm Password</label>
          <input
            className="input-box"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          <label>Passout Year</label>
          <input
            className="input-box"
            type="number"
            value={form.passoutYear}
            onChange={(e) => setForm({ ...form, passoutYear: e.target.value })}
            required
          />
          <button className="btn-primary" style={{ width: "100%" }}>
            Register
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 10 }}>
          Already have an account?{" "}
          <Link to="/login" className="text-blue">Login</Link>
        </p>
      </div>
    </div>
  );
};

// ==============================
// VERIFY OTP PAGE
// ==============================
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
      
      if (!email) {
        toast.error("Email not found. Please register again.");
        navigate("/register");
        return;
      }

      await axios.post("/api/auth/verify-otp", { email, otp });
      localStorage.removeItem("pendingEmail");
      toast.success("Email verified! Please login.");
      navigate("/login");
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error(err.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;

    setResending(true);
    try {
      const email = localStorage.getItem("pendingEmail");
      
      if (!email) {
        toast.error("Email not found. Please register again.");
        navigate("/register");
        return;
      }

      await axios.post("/api/auth/resend-otp", { email });
      toast.success("New OTP sent to your email!");
      
      setCanResend(false);
      setCountdown(60);
      setOtp("");
    } catch (err) {
      console.error("Resend OTP error:", err);
      toast.error(err.response?.data?.message || "Failed to resend OTP");
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
        
        {email && (
          <p style={{ 
            textAlign: "center", 
            color: "#6b7280", 
            marginBottom: 20,
            background: "#f3f4f6",
            padding: "10px",
            borderRadius: "8px"
          }}>
            OTP sent to: <strong>{email}</strong>
          </p>
        )}

        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20 }}>
          Enter the 6-digit OTP sent to your email
        </p>

        <form onSubmit={submit}>
          <label>OTP Code</label>
          <input
            className="input-box"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            maxLength={6}
            placeholder="123456"
            style={{ 
              textAlign: "center", 
              fontSize: "24px", 
              letterSpacing: "8px",
              fontWeight: "bold"
            }}
          />
          
          <button 
            className="btn-primary" 
            style={{ width: "100%", marginTop: 15 }}
          >
            Verify Email
          </button>
        </form>

        <div style={{ 
          marginTop: 20, 
          paddingTop: 20, 
          borderTop: "1px solid #eee",
          textAlign: "center" 
        }}>
          <p style={{ color: "#6b7280", marginBottom: 10 }}>
            Didn't receive the OTP?
          </p>
          
          <button
            onClick={handleResendOtp}
            disabled={!canResend || resending}
            style={{
              background: canResend && !resending ? "#2563eb" : "#e5e7eb",
              color: canResend && !resending ? "white" : "#9ca3af",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: canResend && !resending ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            {resending ? "Sending..." : 
             countdown > 0 ? `Resend OTP (${countdown}s)` : 
             "Resend OTP"}
          </button>
        </div>

        <p style={{ 
          textAlign: "center", 
          marginTop: 20,
          fontSize: "14px",
          color: "#6b7280" 
        }}>
          Wrong email? <Link to="/register" className="text-blue">Register again</Link>
        </p>
      </div>
    </div>
  );
};
// ==============================
// FORGOT PASSWORD PAGE
// ==============================
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
      toast.success("Reset link sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-container" style={{ maxWidth: 450 }}>
        <Toaster />
        <div className="card" style={{ marginTop: 60 }}>
          <h2 className="heading" style={{ textAlign: "center" }}>Check Your Email</h2>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20 }}>
            We've sent a password reset link to:
          </p>
          <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: 20 }}>
            {email}
          </p>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20 }}>
            Click the link in the email to reset your password.
          </p>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
            Link expires in 1 hour.
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate("/login")}
            style={{ width: "100%", marginTop: 20 }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Forgot Password?</h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20 }}>
          Enter your email and we'll send you a link to reset your password.
        </p>
        <form onSubmit={submit}>
          <label>Email</label>
          <input
            className="input-box"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="your@email.com"
          />
          <button 
            className="btn-primary" 
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 15 }}>
          Remember your password?{" "}
          <Link to="/login" className="text-blue">Login</Link>
        </p>
      </div>
    </div>
  );
};

// ==============================
// RESET PASSWORD PAGE
// ==============================
const ResetPasswordPage = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, password });
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container" style={{ maxWidth: 450 }}>
        <Toaster />
        <div className="card" style={{ marginTop: 60 }}>
          <h2 className="heading" style={{ textAlign: "center", color: "#15803d" }}>✅ Success!</h2>
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 20 }}>
            Your password has been reset successfully.
          </p>
          <p style={{ textAlign: "center", color: "#6b7280" }}>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Reset Password</h2>
        <form onSubmit={submit}>
          <label>New Password</label>
          <input
            className="input-box"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter new password"
          />
          <label>Confirm Password</label>
          <input
            className="input-box"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            placeholder="Confirm password"
          />
          <button 
            className="btn-primary" 
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
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
    load();
  }, []);

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

  return (
    <div className="page-container">
      <Toaster />
      <h1 style={{ marginBottom: 20 }}>Dashboard</h1>
      <Link to="/alumni" className="btn-primary" style={{ marginBottom: 20, display: "inline-block" }}>
        Browse Alumni
      </Link>
      
      <div className="grid-3">
        <div className="card">
          <p>Total Alumni</p>
          <h2>{alumni.length}</h2>
        </div>
        <div className="card">
          <p>Active Jobs</p>
          <h2>{jobs.length}</h2>
        </div>
        <div className="card">
          <p>Your Profile</p>
          <h3>{user?.headline || "Not set"}</h3>
          <Link className="text-blue" to="/profile/edit">Edit Profile</Link>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Recent Alumni</h2>
          {alumni.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No alumni found</p>
          ) : (
            alumni.map((p) => (
              <div key={p.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 8 }}>
                {p.first_name} {p.last_name}
              </div>
            ))
          )}
        </div>
        <div className="card">
          <h2>Latest Jobs</h2>
          {jobs.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No jobs found</p>
          ) : (
            jobs.map((job) => (
              <div key={job.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 8 }}>
                {job.title} – {job.company}
              </div>
            ))
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

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    try {
      const res = await axios.get("/api/users/directory");
      setAlumni(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load alumni");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container">Loading alumni...</div>;

  return (
    <div className="page-container">
      <Toaster />
      <h1>Alumni Directory</h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>Total: {alumni.length}</p>
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
    </div>
  );
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
      setLoading(true);
      setError(null);
      
      try {
        const res = await axios.get(`/api/users/${id}`);
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to load user:", err);
        setError(err.response?.data?.message || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page-container">
        <Toaster />
        <div className="card">
          <h2>User Not Found</h2>
          <p style={{ color: "#6b7280", marginBottom: 15 }}>
            {error || "This user profile could not be found."}
          </p>
          <Link to="/alumni" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
            Back to Alumni List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Toaster />
      <div className="card">
        <h2>{user.first_name} {user.last_name}</h2>
        <p style={{ color: "#6b7280", fontSize: "18px", marginTop: 5 }}>
          {user.headline || "Alumni"}
        </p>
        
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eee" }}>
          <p><b>Batch:</b> {user.passout_year || "N/A"}</p>
          {user.email && <p><b>Email:</b> {user.email}</p>}
          {user.current_company && <p><b>Company:</b> {user.current_company}</p>}
          {user.location && <p><b>Location:</b> {user.location}</p>}
        </div>
        
        {user.bio && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #eee" }}>
            <h3 style={{ marginTop: 0 }}>About</h3>
            <p style={{ color: "#4b5563", lineHeight: 1.6 }}>{user.bio}</p>
          </div>
        )}
        
        <div style={{ marginTop: 25, display: "flex", gap: 10 }}>
          <button 
            className="btn-primary" 
            onClick={() => toast.success("Connect feature coming soon!")}
          >
            Connect
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => toast.success("Messaging feature coming soon!")}
          >
            Message
          </button>
        </div>
      </div>
      
      <Link 
        to="/alumni" 
        className="text-blue" 
        style={{ display: "inline-block", marginTop: 20, fontSize: "16px" }}
      >
        ← Back to Alumni List
      </Link>
    </div>
  );
};

// ==============================
// EDIT PROFILE
// ==============================
const EditProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    headline: "",
    bio: "",
    location: "",
    currentCompany: ""
  });

  useEffect(() => {
    if (user) {
      setForm({
        headline: user.headline || "",
        bio: user.bio || "",
        location: user.location || "",
        currentCompany: user.current_company || ""
      });
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/users/profile", form);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "Type 'DELETE' in your mind - this will permanently delete all your data including jobs, applications, and profile."
    );
    
    if (!doubleConfirm) return;

    try {
      await axios.delete("/api/users/account");
      toast.success("Account deleted successfully!");
      logout();
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <Toaster />
      <div className="card">
        <h2>Edit Profile</h2>
        <form onSubmit={submit}>
          <label>Headline</label>
          <input
            className="input-box"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
          <label>Bio</label>
          <textarea
            className="input-box"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <label>Location</label>
          <input
            className="input-box"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <label>Company</label>
          <input
            className="input-box"
            value={form.currentCompany}
            onChange={(e) => setForm({ ...form, currentCompany: e.target.value })}
          />
          <button className="btn-primary" style={{ width: "100%", marginTop: 15 }}>
            Save Changes
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20, background: "#fee2e2", border: "1px solid #fca5a5" }}>
        <h3 style={{ marginTop: 0, color: "#dc2626" }}>Danger Zone</h3>
        <p style={{ color: "#991b1b", marginBottom: 15 }}>
          Permanently delete your account and all associated data.
        </p>
        <button 
          className="btn-danger"
          onClick={handleDeleteAccount}
          style={{ width: "100%" }}
        >
          🗑️ Delete My Account
        </button>
      </div>
    </div>
  );
};

// ==============================
// CREATE JOB MODAL
// ==============================
const CreateJobModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    requirements: "",
    location: "",
    salaryRange: "",
    jobType: "Full-time",
    experienceLevel: "Mid-level"
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        company: form.company,
        description: form.description,
        requirements: form.requirements,
        location: form.location,
        salaryRange: form.salaryRange,
        jobType: form.jobType,
        experienceLevel: form.experienceLevel
      };
      
      console.log("Posting job with payload:", payload);
      await axios.post("/api/jobs", payload);
      toast.success("Job posted successfully!");
      onSuccess();
    } catch (err) {
      console.error("Failed to post job:", err);
      toast.error(err.response?.data?.message || "Failed to post job");
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div className="card" style={{ 
        maxWidth: 600, 
        width: "100%", 
        maxHeight: "90vh", 
        overflow: "auto" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Post a Job</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: "none", 
              border: "none", 
              fontSize: "24px", 
              cursor: "pointer",
              color: "#6b7280"
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Job Title *</label>
          <input
            className="input-box"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="e.g. Senior Software Engineer"
          />

          <label>Company *</label>
          <input
            className="input-box"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            required
            placeholder="e.g. Tech Corp"
          />

          <label>Location</label>
          <input
            className="input-box"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Remote, New York, etc."
          />

          <label>Job Type *</label>
          <select
            className="input-box"
            value={form.jobType}
            onChange={(e) => setForm({ ...form, jobType: e.target.value })}
            required
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>

          <label>Experience Level *</label>
          <select
            className="input-box"
            value={form.experienceLevel}
            onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
            required
          >
            <option value="Entry-level">Entry-level</option>
            <option value="Mid-level">Mid-level</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Executive">Executive</option>
          </select>

          <label>Salary Range</label>
          <input
            className="input-box"
            value={form.salaryRange}
            onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
            placeholder="e.g. $80K - $120K"
          />

          <label>Job Description *</label>
          <textarea
            className="input-box"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
          />

          <label>Requirements</label>
          <textarea
            className="input-box"
            rows={4}
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            placeholder="List the required skills, qualifications, and experience..."
          />

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ flex: 1 }}
              disabled={submitting}
            >
              {submitting ? "Posting..." : "Post Job"}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==============================
// JOB CARD
// ==============================
const JobCard = ({ job, onJobDeleted }) => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();

  const handleDeleteJob = async () => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.delete(`/api/jobs/${job.id}`);
        toast.success("Job deleted!");
        if (onJobDeleted) onJobDeleted();
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete job");
      }
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0, marginBottom: 5 }}>{job.title}</h3>
          <p style={{ color: "#6b7280", marginBottom: 10, fontSize: "16px" }}>
            <strong>{job.company}</strong>
            {job.location && ` • ${job.location}`}
          </p>
          
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {job.job_type && (
              <span style={{ 
                background: "#e0f2fe", 
                color: "#0369a1", 
                padding: "4px 12px", 
                borderRadius: "6px",
                fontSize: "14px"
              }}>
                {job.job_type}
              </span>
            )}
            {job.experience_level && (
              <span style={{ 
                background: "#f3e8ff", 
                color: "#7c3aed", 
                padding: "4px 12px", 
                borderRadius: "6px",
                fontSize: "14px"
              }}>
                {job.experience_level}
              </span>
            )}
            {job.salary_range && (
              <span style={{ 
                background: "#dcfce7", 
                color: "#15803d", 
                padding: "4px 12px", 
                borderRadius: "6px",
                fontSize: "14px"
              }}>
                {job.salary_range}
              </span>
            )}
          </div>

          {expanded && (
            <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid #eee" }}>
              <h4 style={{ marginTop: 0 }}>Description</h4>
              <p style={{ color: "#4b5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {job.description}
              </p>
              
              {job.requirements && (
                <>
                  <h4 style={{ marginTop: 15 }}>Requirements</h4>
                  <p style={{ color: "#4b5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {job.requirements}
                  </p>
                </>
              )}
              
              <p style={{ color: "#6b7280", fontSize: "14px", marginTop: 15 }}>
                Posted by: {job.first_name} {job.last_name}
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 15, flexWrap: "wrap" }}>
        <button 
          className="btn-primary"
          onClick={() => toast.success("Apply feature coming soon!")}
        >
          Apply Now
        </button>
        <button 
          className="btn-secondary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show Less" : "View Details"}
        </button>
        
        {user?.id === job.posted_by && (
          <button 
            className="btn-danger"
            onClick={handleDeleteJob}
          >
            Delete Job
          </button>
        )}
      </div>
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

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await axios.get("/api/jobs");
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-container">Loading jobs...</div>;
  }

  return (
    <div className="page-container">
      <Toaster />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Job Board</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Post a Job
        </button>
      </div>

      {showCreateModal && (
        <CreateJobModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            loadJobs();
          }}
        />
      )}

      {jobs.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: "center", color: "#6b7280" }}>
            No jobs posted yet. Be the first to post a job!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {jobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job}
              onJobDeleted={loadJobs}
            />
          ))}
        </div>
      )}
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
           <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          
          <Route path="/" element={<PrivateRoute><PrivateLayout><DashboardPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni" element={<PrivateRoute><PrivateLayout><AlumniList /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni/:id" element={<PrivateRoute><PrivateLayout><AlumniProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/profile/edit" element={<PrivateRoute><PrivateLayout><EditProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><PrivateLayout><div className="page-container">Messages coming soon</div></PrivateLayout></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><PrivateLayout><JobsPage /></PrivateLayout></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;



