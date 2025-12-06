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

  console.log("👤 Navbar user:", user);

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 30px",
      borderBottom: "2px solid #ddd",
      background: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      minHeight: "60px"
    }}>
      <Link to="/" style={{ textDecoration: "none", color: "#000", fontSize: "18px" }}>
        <strong>🎓 Alumni Network</strong>
      </Link>
      
      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Link to="/" className="text-blue">Home</Link>
        <Link to="/alumni" className="text-blue">Alumni</Link>
        <Link to="/messages" className="text-blue">Messages</Link>
        <Link to="/jobs" className="text-blue">Jobs</Link>
        <Link to="/profile/edit" className="text-blue">Profile</Link>
        <span style={{ color: "#6b7280", fontWeight: "500" }}>
          Hi, {user?.first_name || user?.firstName || "User"}
        </span>
        <button className="btn-danger" onClick={doLogout}>Logout</button>
      </div>
    </div>
  );
};

// ==============================
// PRIVATE ROUTE
// ==============================
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log("🔒 PrivateRoute - loading:", loading, "user:", user);
  
  if (loading) {
    console.log("⏳ Still loading...");
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
  
  if (!user) {
    console.log("❌ No user, redirecting to login");
  } else {
    console.log("✅ User authenticated, showing content");
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// ==============================
// PRIVATE LAYOUT
// ==============================
const PrivateLayout = ({ children }) => {
  console.log("📄 PrivateLayout rendering");
  return (
    <>
      <Navbar />
      <div className="app-content">
        {children}
      </div>
    </>
  );
};

// ==============================
// LOGIN PAGE
// ==============================
const LoginPage = () => {
  console.log("🔐 LoginPage rendering");
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
        </p>
      </div>
    </div>
  );
};

// ==============================
// REGISTER PAGE
// ==============================
const RegisterPage = () => {
  console.log("📝 RegisterPage rendering");
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    passoutYear: new Date().getFullYear(),
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
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
  console.log("✉️ VerifyOtp rendering");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const email = localStorage.getItem("pendingEmail");
      await axios.post("/api/auth/verify-otp", { email, otp });
      localStorage.removeItem("pendingEmail");
      toast.success("Email verified! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>Verify Email</h2>
        <p style={{ textAlign: "center", color: "#6b7280" }}>
          Enter the OTP sent to your email
        </p>
        <form onSubmit={submit}>
          <label>OTP Code</label>
          <input
            className="input-box"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
          />
          <button className="btn-primary" style={{ width: "100%", marginTop: 10 }}>
            Verify
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
  console.log("🏠 DashboardPage rendering");
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
      console.log("📊 Data loaded - Alumni:", a.data.users?.length, "Jobs:", j.data.jobs?.length);
      setAlumni(a.data.users || []);
      setJobs(j.data.jobs || []);
    } catch (err) {
      console.error("❌ Failed to load data:", err);
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
  console.log("👥 AlumniList rendering");
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    try {
      const res = await axios.get("/api/users/directory");
      console.log("📋 Alumni loaded:", res.data.users?.length);
      setAlumni(res.data.users || []);
    } catch (err) {
      console.error("❌ Failed to load alumni:", err);
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
  console.log("👤 AlumniProfile rendering");
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log("Fetching user:", id);
    axios.get(`/api/users/${id}`)
      .then(res => {
        console.log("User loaded:", res.data.user);
        setUser(res.data.user);
      })
      .catch(err => {
        console.error("Failed to load user:", err);
        alert("User not found");
      });
  }, [id]);

  if (!user) return <div className="page-container">Loading profile...</div>;

  return (
    <div className="page-container">
      <Toaster />
      <div className="card">
        <h2>{user.first_name} {user.last_name}</h2>
        <p>{user.headline}</p>
        <p><b>Batch:</b> {user.passout_year}</p>
        <p>{user.bio}</p>
        <div style={{ marginTop: 15 }}>
          <button className="btn-primary">Connect</button>
          <button style={{ marginLeft: 10 }} className="btn-secondary">Message</button>
        </div>
      </div>
    </div>
  );
};

// ==============================
// EDIT PROFILE
// ==============================
const EditProfile = () => {
  console.log("✏️ EditProfile rendering");
  const { user } = useAuth();
  const [form, setForm] = useState({
    headline: "",
    bio: "",
    location: "",
    company: ""
  });

  useEffect(() => {
    if (user) {
      setForm({
        headline: user.headline || "",
        bio: user.bio || "",
        location: user.location || "",
        company: user.company || ""
      });
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/users/profile", form);
      toast.success("Profile updated!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Failed to update profile");
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
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <button className="btn-primary" style={{ width: "100%", marginTop: 15 }}>
            Save Changes
          </button>
        </form>
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
          
          <Route path="/" element={<PrivateRoute><PrivateLayout><DashboardPage /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni" element={<PrivateRoute><PrivateLayout><AlumniList /></PrivateLayout></PrivateRoute>} />
          <Route path="/alumni/:id" element={<PrivateRoute><PrivateLayout><AlumniProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/profile/edit" element={<PrivateRoute><PrivateLayout><EditProfile /></PrivateLayout></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><PrivateLayout><div className="page-container">Messages coming soon</div></PrivateLayout></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><PrivateLayout><div className="page-container">Jobs page</div></PrivateLayout></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
