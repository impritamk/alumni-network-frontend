
import "./styles.css";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast"; // <-- Add this line right here!


const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const SinglePostPage = lazy(() => import('./pages/SinglePostPage'));
const AlumniList = lazy(() => import('./pages/AlumniList'));
const AlumniProfile = lazy(() => import('./pages/AlumniProfile'));


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
// 404 NOT FOUND PAGE
// ==============================
export const PageSkeleton = () => {
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
  // --- Global Theme Initialization ---
  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        {/* ADD THIS SUSPENSE LINE */}
        <Suspense fallback={<PageSkeleton />}>
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
        {/* AND CLOSE IT HERE */}
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
