import "./styles.css";

import EditProfile from "./pages/EditProfile";
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
      const response = await axios.get("/api/auth/me");
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post("/api/auth/login", { email, password });
    const { token, user } = response.data;
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const response = await axios.post("/api/auth/register", userData);
    return response.data;
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

// Protected Route
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Login successful!");
      window.location.href = "/";
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Toaster />
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Alumni Network</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Login
          </button>
        </form>

        <p className="mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600">
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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    passoutYear: new Date().getFullYear(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      toast.success("Registration successful! Please login.");
      window.location.href = "/login";
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Toaster />
      <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Passout Year</label>
            <input
              type="number"
              value={formData.passoutYear}
              onChange={(e) =>
                setFormData({ ...formData, passoutYear: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Register
          </button>
        </form>

        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [alumniRes, jobsRes] = await Promise.all([
        axios.get("/api/users/directory?limit=10"),
        axios.get("/api/jobs"),
      ]);

      setAlumni(alumniRes.data.users);
      setJobs(jobsRes.data.jobs);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Toaster />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 className="heading">Alumni Network</h1>

        <div>
          <span style={{ marginRight: 20 }}>Welcome, {user?.first_name}!</span>
          <button onClick={logout} className="btn-danger">Logout</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-3">
        <div className="card">
          <p>Total Alumni</p>
          <h2 className="heading">{alumni.length}</h2>
        </div>

        <div className="card">
          <p>Active Jobs</p>
          <h2 className="heading">{jobs.length}</h2>
        </div>

        <div className="card">
          <p>Your Profile</p>
          <h3>{user?.headline || "Not set"}</h3>
          <Link to="/profile/edit" className="text-blue">
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Alumni + Jobs Sections */}
      <div className="grid-2">
        {/* Recent Alumni */}
        <div className="card">
          <h2 className="section-title">Recent Alumni</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            alumni.map((p) => (
              <div key={p.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 10 }}>
                <p className="section-title">{p.first_name} {p.last_name}</p>
                <p>{p.headline || "Alumni"}</p>
                <p>Class of {p.passout_year}</p>
              </div>
            ))
          )}
        </div>

        {/* Latest Jobs */}
        <div className="card">
          <h2 className="section-title">Latest Jobs</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            jobs.slice(0, 5).map((job) => (
              <div key={job.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginBottom: 10 }}>
                <p className="section-title">{job.title}</p>
                <p>{job.company}</p>
                <p>{job.location}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile/edit"
            element={
              <PrivateRoute>
                <EditProfile />
              </PrivateRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;


