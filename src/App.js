import "./styles.css";

import EditProfile from "./pages/EditProfile";
import VerifyOtp from "./pages/VerifyOtp";   // ✅ Added
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

// Configure axios
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
axios.defaults.baseURL = API_URL;

// Auth Context
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
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/api/auth/me");
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post("/api/auth/login", { email, password });
    const { token, user } = res.data;

    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(user);

    return user;
  };

  const register = async (data) => {
    const res = await axios.post("/api/auth/register", data);
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

// Protected routes
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// Login Page
const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Login successful");
      window.location.href = "/";
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />
      <div className="card" style={{ marginTop: 60 }}>

        <h2 className="heading" style={{ textAlign: "center" }}>
          Alumni Network Login
        </h2>

        <form onSubmit={submit}>
          <label>Email</label>
          <input
            className="input-box"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            className="input-box"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn-primary" style={{ width: "100%" }}>
            Login
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 10 }}>
          Don't have an account?{" "}
          <Link to="/register" className="text-blue">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

// Register Page
const RegisterPage = () => {
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

      toast.success("OTP sent! Please verify.");
      window.location.href = "/verify-otp";

    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 450 }}>
      <Toaster />

      <div className="card" style={{ marginTop: 60 }}>
        <h2 className="heading" style={{ textAlign: "center" }}>
          Create Account
        </h2>

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
            onChange={(e) =>
              setForm({ ...form, passoutYear: e.target.value })
            }
            required
          />

          <button className="btn-primary" style={{ width: "100%" }}>
            Register
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 10 }}>
          Already have an account?{" "}
          <Link to="/login" className="text-blue">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const { user, logout } = useAuth();
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

      setAlumni(a.data.users);
      setJobs(j.data.jobs);
    } catch {
      toast.error("Failed to load data");
    }
  };

  return (
    <div className="page-container">
      <Toaster />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 className="heading">Alumni Network</h1>

        <div>
          <span style={{ marginRight: 15 }}>
            Welcome, {user?.first_name}!
          </span>

          <button className="btn-danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

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
          <Link className="text-blue" to="/profile/edit">
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Recent Alumni</h2>
          {alumni.map((p) => (
            <div key={p.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 8 }}>
              {p.first_name} {p.last_name}
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Latest Jobs</h2>
          {jobs.map((job) => (
            <div key={job.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 8 }}>
              {job.title} – {job.company}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// App
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          <Route path="/" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          } />

          <Route path="/profile/edit" element={
            <PrivateRoute><EditProfile /></PrivateRoute>
          } />

          <Route path="/verify-otp" element={<VerifyOtp />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
