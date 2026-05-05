import "./styles.css";
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";
import Microlink from '@microlink/react';



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

const PostItem = ({ post, user, onDelete, isSingleView = false }) => {
  // 1. NEW: Give the post its own local memory so it doesn't need to refresh the whole feed!
  const [currentPost, setCurrentPost] = useState(post);
  
  const [showComments, setShowComments] = useState(isSingleView); 
  const [commentText, setCommentText] = useState(""); 
  const [isLiking, setIsLiking] = useState(false);
  const navigate = useNavigate();
  
  // Sync local state if the parent passes a brand new post prop
  useEffect(() => { setCurrentPost(post); }, [post]);

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = currentPost.content.match(urlRegex);
  const firstUrl = urls ? urls[0] : null; 

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const ytId = firstUrl ? getYouTubeId(firstUrl) : null;

  const handleLike = async () => { 
    if (isLiking) return; 
    setIsLiking(true); 
    
    // 2. OPTIMISTIC UI: Instantly update the UI before the server even responds!
    const wasLiked = currentPost.user_liked;
    setCurrentPost(prev => ({
      ...prev,
      user_liked: !wasLiked,
      like_count: wasLiked ? parseInt(prev.like_count) - 1 : parseInt(prev.like_count) + 1
    }));

    try { 
      await axios.post(`/api/posts/${currentPost.id}/like`); 
      // We don't call onRefresh anymore! The local state already updated.
    } catch (err) { 
      // If the server fails, silently revert the heart back to normal
      setCurrentPost(post);
      toast.error("Failed to like post"); 
    } 
    finally { setIsLiking(false); } 
  };
  
  const handleComment = async (e) => { 
    e.preventDefault(); 
    if (!commentText.trim()) return; 
    try { 
      const res = await axios.post(`/api/posts/${currentPost.id}/comments`, { content: commentText }); 
      
      // 3. OPTIMISTIC UI: Construct the new comment locally and push it to the array
      const newComment = {
        id: res.data.comment.id,
        content: res.data.comment.content,
        created_at: res.data.comment.created_at,
        user_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      };

      setCurrentPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
      setCommentText(""); 
    } catch (err) { toast.error("Failed to post comment"); } 
  };
  
  const handleDeleteComment = async (commentId) => { 
    if (!window.confirm("Delete this comment?")) return; 
    
    // 4. OPTIMISTIC UI: Instantly hide the comment locally
    setCurrentPost(prev => ({
      ...prev,
      comments: prev.comments.filter(c => c.id !== commentId)
    }));

    try { 
      await axios.delete(`/api/posts/comments/${commentId}`); 
    } catch (err) { 
      setCurrentPost(post); // Revert if failed
      toast.error("Failed to delete comment"); 
    } 
  };

  const handleShare = () => {
    const link = `${window.location.origin}/post/${currentPost.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleCardClick = () => {
    if (!isSingleView) {
      navigate(`/post/${currentPost.id}`);
    }
  };
  
  return (
    <div 
      className="card" 
      onClick={handleCardClick}
      style={{ marginBottom: "15px", cursor: !isSingleView ? "pointer" : "default", transition: "transform 0.2s" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div 
          className="post-header" 
          onClick={(e) => { e.stopPropagation(); navigate(`/alumni/${currentPost.user_id}`); }}
          style={{ cursor: "pointer", display: "flex", gap: "10px" }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {currentPost.first_name[0]}
          </div>
          <div>
            <h4 style={{ margin: "0 0 2px 0", color: "inherit", display: "flex", alignItems: "center" }}>
              {currentPost.first_name} {currentPost.last_name}
              {currentPost.role === 'admin' && <span className="admin-badge">ADMIN</span>}
            </h4>
            <span className="college-display" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chaibasa Engineering College</span>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
              {new Date(currentPost.created_at).toLocaleDateString('en-GB')} at {new Date(currentPost.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        {(user?.role === 'admin' || user?.id === currentPost.user_id) && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(currentPost.id); }} className="btn-danger" style={{ padding: "4px 10px", fontSize: "12px" }}><i className="fas fa-trash"></i></button>
        )}
      </div>
      
      <p style={{ margin: "15px 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{currentPost.content}</p>
      
      {firstUrl && ytId ? (
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
        <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: "15px", overflow: "hidden", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <Microlink url={firstUrl} style={{ width: '100%', border: 'none', borderRadius: '8px' }} size="large" />
        </div>
      ) : null}
      
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "15px", borderTop: "1px solid var(--border-color)", paddingTop: "10px", flexWrap: "wrap" }}>
        <button onClick={handleLike} disabled={isLiking} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: currentPost.user_liked ? "var(--danger)" : "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className={currentPost.user_liked ? "fas fa-heart" : "far fa-heart"}></i> {currentPost.like_count || 0} Likes
        </button>
        <button onClick={() => setShowComments(!showComments)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className="far fa-comment"></i> {currentPost.comments?.length || 0} Comments
        </button>
        <button onClick={handleShare} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className="fas fa-share"></i> Share
        </button>
      </div>

      {showComments && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "15px", background: "var(--bg-color)", padding: "15px", borderRadius: "8px" }}>
          <form onSubmit={handleComment} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input type="text" className="input-box" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ marginBottom: 0, flex: 1 }} />
            <button type="submit" className="btn-primary" disabled={!commentText.trim()}>Post</button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {currentPost.comments && currentPost.comments.length > 0 ? (currentPost.comments.map(c => (
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

// ==============================
// ALUMNI DIRECTORY (WITH LIVE SEARCH)
// ==============================
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
  
  // --- NEW: THE DEBOUNCE EFFECT ---
  useEffect(() => {
    // 1. Start a 500ms timer every time 'searchTerm' changes
    const delaySearch = setTimeout(() => {
      loadAlumni(searchTerm);
    }, 500);

    // 2. CLEANUP: If the user types another letter BEFORE the 500ms is up,
    // React runs this cleanup function, destroys the old timer, and starts a fresh one!
    return () => clearTimeout(delaySearch);
  }, [searchTerm]); 
  // --------------------------------

  return (
    <div className="page-container">
      <Toaster />
      <h1>Alumni Directory</h1>
      
      <div className="card" style={{ marginBottom: 20 }}>
        {/* Notice we removed the <form> and the Submit button! It's completely automatic now. */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <i className="fas fa-search" style={{ color: "var(--text-muted)", marginLeft: "10px" }}></i>
          <input 
            type="text" 
            className="input-box" 
            placeholder="Search by name, email, or batch (e.g., 2026)..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ marginBottom: 0, flex: 1, border: "none", boxShadow: "none", background: "transparent" }} 
          />
        </div>
      </div>

      {loading ? <PageSkeleton /> : (
        <div className="grid-3">
          {alumni.map((person) => (
            <div key={person.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0" }}>{person.first_name} {person.last_name}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "0 0 10px 0", lineHeight: "1.4" }}>{person.headline || "Alumni"}</p>
                <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569", fontWeight: "600" }}>
                  Batch {person.passout_year}
                </span>
              </div>
              <Link to={`/alumni/${person.id}`} className="btn-secondary" style={{ textDecoration: "none", display: "block", textAlign: "center", marginTop: "15px" }}>
                View Profile
              </Link>
            </div>
          ))}
          
          {alumni.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0" }}>
              <i className="fas fa-user-slash fa-3x" style={{ color: "var(--text-muted)", marginBottom: "15px" }}></i>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No alumni found matching "{searchTerm}".</p>
            </div>
          )}
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
