import EditProfile from "./pages/EditProfile";
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// Configure axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_URL;

// Auth Context
const useAuth = () => React.useContext(AuthContext);


const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// Protected Route
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
};

// Login Page
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Login successful!');
      window.location.href = '/';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
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
          Don't have an account?{' '}
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
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    passoutYear: new Date().getFullYear(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      toast.success('Registration successful! Please login.');
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label>Passout Year</label>
            <input
              type="number"
              value={formData.passoutYear}
              onChange={(e) => setFormData({ ...formData, passoutYear: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Register
          </button>
        </form>

        <p className="mt-4 text-center">
          Already have an account?{' '}
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
        axios.get('/api/users/directory?limit=10'),
        axios.get('/api/jobs'),
      ]);
      setAlumni(alumniRes.data.users);
      setJobs(jobsRes.data.jobs);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Toaster />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Alumni Network</h1>
        <div>
          <span className="mr-4">Welcome, {user?.first_name}!</span>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg">
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 shadow rounded bg-white">
          <p>Total Alumni</p>
          <h2 className="text-2xl font-bold">{alumni.length}</h2>
        </div>

        <div className="p-4 shadow rounded bg-white">
          <p>Active Jobs</p>
          <h2 className="text-2xl font-bold">{jobs.length}</h2>
        </div>

        <div className="p-4 shadow rounded bg-white">
  <p>Your Profile</p>
  <h2 className="text-lg">{user?.headline || 'Not set'}</h2>
  <Link
    to="/profile/edit"
    className="text-blue-600 underline mt-2 inline-block"
  >
    Edit Profile
  </Link>
</div>

      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-bold mb-3">Recent Alumni</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            alumni.map((p) => (
              <div key={p.id} className="border-b py-2">
                <p className="font-bold">{p.first_name} {p.last_name}</p>
                <p>{p.headline || 'Alumni'}</p>
                <p>Class of {p.passout_year}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h2 className="font-bold mb-3">Latest Jobs</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="border-b py-2">
                <p className="font-bold">{job.title}</p>
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

// Main App
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
  <Route path="/" element={
    <PrivateRoute>
      <DashboardPage />
    </PrivateRoute>
  } />

  {/* 👇 ADD THIS ROUTE */}
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

  {/* Redirect unknown routes */}
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>

      </AuthProvider>
    </Router>
  );
}

export default App;




