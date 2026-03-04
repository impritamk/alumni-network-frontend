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
// MODERN MOBILE-FIRST NAVBAR
// ==============================
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{
      background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
      padding: "12px 16px",
      boxShadow: "0 10px 30px rgba(37, 99, 235, 0.2)",
      position: "sticky",
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "24px" }}>🎓</div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "white", fontFamily: "'Poppins', sans-serif" }}>
            Alumni
          </div>
        </Link>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "white", fontWeight: "500", fontSize: "12px" }}>
            {user?.first_name}
          </span>
          <button 
            onClick={doLogout}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s",
              fontSize: "12px"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
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
        fontSize: '20px',
        background: "linear-gradient(135deg, #f5f7fa 0%, #e0e7ff 100%)"
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: "#f5f7fa" }}>
      <Navbar />
      <div style={{ flex: 1, padding: "16px", paddingBottom: "80px" }}>
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
};

// ==============================
// MOBILE BOTTOM NAVIGATION
// ==============================
const MobileBottomNav = () => {
  const navigate = useNavigate();

  const navItems = [
    { icon: "fas fa-home", label: "Home", path: "/" },
    { icon: "fas fa-users", label: "Alumni", path: "/alumni" },
    { icon: "fas fa-briefcase", label: "Jobs", path: "/jobs" },
    { icon: "fas fa-user", label: "Profile", path: "/profile/edit" }
  ];

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "white",
      borderTop: "1px solid #e5e7eb",
      boxShadow: "0 -5px 20px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "space-around",
      padding: "8px 0",
      zIndex: 999
    }}>
      {navItems.map(item => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            padding: "8px 12px",
            cursor: "pointer",
            color: "#6b7280",
            transition: "all 0.3s",
            fontSize: "12px",
            fontWeight: "600",
            flex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6b7280";
          }}
        >
          <i style={{ fontSize: "20px" }} className={item.icon}></i>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// ==============================
// MODERN DASHBOARD
// ==============================
const DashboardPage = () => {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

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
    <div>
      <Toaster />
      
      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
        borderRadius: "16px",
        padding: "32px 20px",
        color: "white",
        marginBottom: "24px",
        textAlign: "center",
        boxShadow: "0 20px 50px rgba(37, 99, 235, 0.2)"
      }}>
        <h1 style={{ fontSize: "28px", marginBottom: "8px", color: "#ffffff" }}>
          Welcome, {user?.first_name}! 👋
        </h1>
        <p style={{ fontSize: "14px", color: "#f0f4ff", marginBottom: "24px", lineHeight: "1.6" }}>
          Connect with alumni, discover opportunities
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button 
            onClick={() => navigate("/alumni")}
            style={{
              background: "white",
              color: "#2563eb",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.3s",
              fontSize: "13px"
            }}
          >
            <i style={{ marginRight: "6px" }} className="fas fa-search"></i>
            Browse Alumni
          </button>
          <button 
            onClick={() => navigate("/jobs")}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "2px solid white",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.3s",
              fontSize: "13px"
            }}
          >
            <i style={{ marginRight: "6px" }} className="fas fa-briefcase"></i>
            Jobs
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ fontSize: "32px" }}>👥</div>
          <div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#2563eb" }}>
              {alumni.length}
            </div>
            <div style={{ color: "#6b7280", fontWeight: "600", fontSize: "12px" }}>Alumni Connected</div>
          </div>
        </div>

        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ fontSize: "32px" }}>💼</div>
          <div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#7c3aed" }}>
              {jobs.length}
            </div>
            <div style={{ color: "#6b7280", fontWeight: "600", fontSize: "12px" }}>Active Jobs</div>
          </div>
        </div>

        <div style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ fontSize: "32px" }}>{user?.headline ? "✓" : "⚠"}</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937" }}>
              {user?.headline ? "Profile Complete" : "Complete Profile"}
            </div>
            <div style={{ color: "#6b7280", fontWeight: "600", fontSize: "12px" }}>Profile Status</div>
          </div>
        </div>
      </div>

      {/* Recent Alumni */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        marginBottom: "24px",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>
            <i style={{ marginRight: "8px", color: "#2563eb" }} className="fas fa-users"></i>
            Recent Alumni
          </h2>
          <Link to="/alumni" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none", fontSize: "12px" }}>
            View All →
          </Link>
        </div>
        
        {alumni.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "20px", margin: 0, fontSize: "13px" }}>
            No alumni found
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {alumni.slice(0, 5).map((person) => (
              <Link
                key={person.id}
                to={`/alumni/${person.id}`}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#f9fafb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e0e7ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
              >
                <div>
                  <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>
                    {person.first_name} {person.last_name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    Batch {person.passout_year}
                  </div>
                </div>
                <i style={{ color: "#2563eb" }} className="fas fa-arrow-right"></i>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Latest Jobs */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>
            <i style={{ marginRight: "8px", color: "#7c3aed" }} className="fas fa-briefcase"></i>
            Latest Jobs
          </h2>
          <Link to="/jobs" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none", fontSize: "12px" }}>
            View All →
          </Link>
        </div>
        
        {jobs.length === 0 ? (
          <p style={{ color: "#6b7280", textAlign: "center", padding: "20px", margin: 0, fontSize: "13px" }}>
            No jobs posted yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {jobs.slice(0, 5).map((job) => (
              <div 
                key={job.id}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#f9fafb",
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f0f4ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                }}
              >
                <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "4px", fontSize: "14px" }}>
                  {job.title}
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>
                  {job.company} • {job.location || "Remote"}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {job.job_type && (
                    <span style={{
                      background: "#e0e7ff",
                      color: "#2563eb",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "600"
                    }}>
                      {job.job_type}
                    </span>
                  )}
                  {job.experience_level && (
                    <span style={{
                      background: "#fce7f3",
                      color: "#be123c",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: "600"
                    }}>
                      {job.experience_level}
                    </span>
                  )}
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
// AUTH PAGES (SIMPLIFIED)
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
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <Toaster />
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "32px 24px",
        maxWidth: "100%",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎓</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0" }}>Welcome Back</h2>
          <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Login to Alumni Network</p>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", color: "#1f2937", fontSize: "12px" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              marginBottom: "16px",
              fontFamily: "inherit",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />

          <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", color: "#1f2937", fontSize: "12px" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              marginBottom: "24px",
              fontFamily: "inherit",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />

          <button 
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "16px",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.3s",
              boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)"
            }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ textAlign: "center", color: "#6b7280", marginTop: "16px" }}>
          <p style={{ marginBottom: "12px", fontSize: "14px" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none" }}>
              Register
            </Link>
          </p>
          <Link to="/forgot-password" style={{ color: "#2563eb", fontWeight: "600", textDecoration: "none", fontSize: "12px" }}>
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other pages
const RegisterPage = () => <div style={{ padding: "40px 20px" }}><h1>Register Page</h1><p>Coming soon...</p></div>;
const VerifyOtp = () => <div style={{ padding: "40px 20px" }}><h1>Verify OTP</h1><p>Coming soon...</p></div>;
const ForgotPasswordPage = () => <div style={{ padding: "40px 20px" }}><h1>Forgot Password</h1><p>Coming soon...</p></div>;
const ResetPasswordPage = () => <div style={{ padding: "40px 20px" }}><h1>Reset Password</h1><p>Coming soon...</p></div>;
const AlumniList = () => <div style={{ padding: "20px" }}><h1>Alumni Directory</h1><p>Alumni list coming...</p></div>;
const AlumniProfile = () => <div style={{ padding: "20px" }}><h1>Alumni Profile</h1><p>Profile coming...</p></div>;
const EditProfile = () => <div style={{ padding: "20px" }}><h1>Edit Profile</h1><p>Edit profile coming...</p></div>;
const JobsPage = () => <div style={{ padding: "20px" }}><h1>Jobs</h1><p>Jobs page coming...</p></div>;

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
          
          <Route path="/" element={<PrivateRoute><PrivateLayout><DashboardPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni" element={<PrivateRoute><PrivateLayout><AlumniList /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni/:id" element={<PrivateRoute><PrivateLayout><AlumniProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/profile/edit" element={<PrivateRoute><PrivateLayout><EditProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><PrivateLayout><JobsPage /></PrivateLayout></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
