import "./styles.css";
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
axios.defaults.baseURL = API_URL;

const AuthContext = React.createContext();
export const useAuth = () => React.useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { const token = localStorage.getItem("token"); if (token) { axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; fetchUser(); } else { setLoading(false); } }, []);
  const fetchUser = async () => { try { const res = await axios.get("/api/auth/me"); setUser(res.data.user); } catch (err) { localStorage.removeItem("token"); delete axios.defaults.headers.common["Authorization"]; } finally { setLoading(false); } };
  const login = async (email, password) => { const res = await axios.post("/api/auth/login", { email, password }); localStorage.setItem("token", res.data.token); axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`; setUser(res.data.user); return res.data.user; };
  const register = async (formData) => { const res = await axios.post("/api/auth/register", formData); return res.data; };
  const logout = () => { localStorage.removeItem("token"); delete axios.defaults.headers.common["Authorization"]; setUser(null); };
  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>;
};

// ==============================
// NAVBAR WITH SLEEK DRAWER
// ==============================
const Navbar = () => {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const [menuOpen, setMenuOpen] = useState(false);
  const [indicators, setIndicators] = useState({ hasNewJobs: false, hasUnreadMessages: false });
  const [isDark, setIsDark] = useState(document.body.classList.contains("dark-mode")); 
  useEffect(() => { if (user) { const fetchInd = async () => { try { const res = await axios.get("/api/user/indicators"); setIndicators(res.data); } catch (err) { } }; fetchInd(); const int = setInterval(fetchInd, 60000); return () => clearInterval(int); } }, [user]);
  const doLogout = () => { logout(); navigate("/login"); };
  const toggleDarkMode = () => { document.body.classList.toggle("dark-mode"); setIsDark(!isDark); };
  const Dot = () => <span style={{ position: "absolute", top: "-5px", right: "-10px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 0 2px #ffffff" }}></span>;

  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 30px", margin: "12px 16px", borderRadius: "12px", borderBottom: "none", minHeight: "60px", position: "relative" }}>
      <Link to="/" style={{ textDecoration: "none", fontSize: "22px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo-connectalumni.svg" alt="Logo" style={{ width: "40px", height: "40px", filter: isDark ? "invert(1) brightness(2)" : "none", transition: "filter 0.3s ease" }} />
        <div style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: "-0.5px" }}><span style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Connect</span><span style={{ color: "#2563eb" }}>Alumni</span></div>
      </Link>
      <div className="navbar-desktop-menu" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Link to="/" className="nav-link">Feed</Link><Link to="/dashboard" className="nav-link">Dashboard</Link><Link to="/alumni" className="nav-link">Alumni</Link><Link to="/connections" className="nav-link">Connections</Link>
        <Link to="/messages" onClick={() => setIndicators(prev => ({...prev, hasUnreadMessages: false}))} className="nav-link" style={{position:'relative'}}>Messages {indicators.hasUnreadMessages && <Dot />}</Link>
        <Link to="/jobs" onClick={() => setIndicators(prev => ({...prev, hasNewJobs: false}))} className="nav-link" style={{position:'relative'}}>Jobs {indicators.hasNewJobs && <Dot />}</Link>
        {user?.role === 'admin' && <Link to="/admin" style={{ color: "#ef4444", fontWeight: "700", fontSize: "14px" }}>Admin Panel</Link>}
        <Link to="/profile/edit" className="nav-link">Profile</Link>
        <span style={{ color: "#6b7280", fontWeight: "500" }}>Hi, {user?.first_name || "User"}</span>
        <button onClick={toggleDarkMode} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}><i className={isDark ? "fas fa-sun" : "fas fa-moon"} style={{ color: isDark ? "#fbbf24" : "#6b7280" }}></i></button>
        <button onClick={doLogout} className="btn-primary" style={{ padding: "8px 16px" }}>Logout</button>
      </div>

      <button className="navbar-hamburger-btn" onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#2563eb", position: "relative" }}>☰ {(indicators.hasNewJobs || indicators.hasUnreadMessages) && <Dot />}</button>

      {/* Sleek Mobile Drawer */}
      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} />}
      <div style={{ position: 'fixed', top: 0, right: menuOpen ? 0 : '-300px', width: '250px', height: '100vh', background: 'var(--card-bg, #ffffff)', zIndex: 999, transition: 'right 0.3s ease', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button onClick={() => setMenuOpen(false)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>✕</button>
        <Link to="/" onClick={() => setMenuOpen(false)} style={{textDecoration:'none', color:'inherit', fontSize:'18px'}}>Feed</Link>
        <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{textDecoration:'none', color:'inherit', fontSize:'18px'}}>Dashboard</Link>
        <Link to="/alumni" onClick={() => setMenuOpen(false)} style={{textDecoration:'none', color:'inherit', fontSize:'18px'}}>Alumni</Link>
        <Link to="/connections" onClick={() => setMenuOpen(false)} style={{textDecoration:'none', color:'inherit', fontSize:'18px'}}>Connections</Link>
        <Link to="/messages" onClick={() => setMenuOpen(false)} style={{textDecoration:'none', color:'inherit', fontSize:'18px'}}>Messages {indicators.hasUnreadMessages && "🔴"}</Link>
        <Link to="/jobs" onClick={() => setMenuOpen(false)} style={{textDecoration:'none', color:'inherit', fontSize:'18px'}}>Jobs {indicators.hasNewJobs && "🔴"}</Link>
        {user?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} style={{textDecoration:'none', color:'#ef4444', fontSize:'18px', fontWeight:'bold'}}>Admin Panel</Link>}
        <Link to="/profile/edit" onClick={() => setMenuOpen(false)} style={{textDecoration:'none', color:'inherit', fontSize:'18px'}}>Profile</Link>
        <button onClick={toggleDarkMode} style={{ background: "none", border: "none", color: "#6b7280", textAlign: "left", padding: 0, fontSize:'18px', marginTop:'10px' }}>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
        <button onClick={doLogout} className="btn-danger" style={{marginTop:'auto'}}>Logout</button>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => { const { user, loading } = useAuth(); if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}><i className="fas fa-spinner fa-spin" style={{ color: "#2563eb", marginRight: "10px" }}></i> Loading...</div>; return user ? children : <Navigate to="/login" replace />; };
const PrivateLayout = ({ children }) => { return <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}><Navbar /><div className="app-content" style={{ flex: 1 }}>{children}</div></div>; };

// ==============================
// AUTH PAGES (LOGIN / REGISTER)
// ==============================
const LoginPage = () => { /* Same as before... omitted for space but assume exact match from previous prompt */ };

const RegisterPage = () => {
  const { register } = useAuth();
  // Defaulted to Chaibasa Engineering College
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", collegeName: "Chaibasa Engineering College", passoutYear: new Date().getFullYear() });
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords mismatch!"); return; }
    try {
      await register(form); localStorage.setItem("pendingEmail", form.email.toLowerCase().trim());
      toast.success("OTP sent!"); window.location.href = "/verify-otp";
    } catch (err) { toast.error(err.response?.data?.message || "Registration failed"); }
  };

  return (
    <div className="page-container" style={{ maxWidth: 450 }}><Toaster />
      <div className="card" style={{ marginTop: 60 }}><h2 className="heading" style={{ textAlign: "center" }}>Create Account</h2>
        <form onSubmit={submit}>
          <div style={{display:'flex', gap:10}}><div style={{flex:1}}><label>First Name</label><input className="input-box" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div><div style={{flex:1}}><label>Last Name</label><input className="input-box" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div></div>
          <label>Email</label><input className="input-box" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <label>College Name</label><input className="input-box" type="text" value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} required />
          <label>Password</label><div style={{ position: 'relative' }}><input className="input-box" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }} /><button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} style={{ color: "#6b7280" }}></i></button></div>
          <label>Confirm Password</label><input className="input-box" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required style={{ width: '100%'}} />
          <label>Passout Year</label><input className="input-box" type="number" value={form.passoutYear} onChange={(e) => setForm({ ...form, passoutYear: e.target.value })} required />
          <button className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>Register</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 15 }}>Have an account? <Link to="/login" className="text-blue">Login</Link></p>
      </div>
    </div>
  );
};
const VerifyOtp = () => { /* Same as previous */ }; 
const ForgotPasswordPage = () => { /* Same as previous */ }; 
const ResetPasswordPage = () => { /* Same as previous */ }; 

// ==============================
// EDIT PROFILE
// ==============================
const EditProfile = () => {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", headline: "", bio: "", location: "", currentCompany: "", collegeName: "" });
  useEffect(() => { if (user) setForm({ firstName: user.first_name||"", lastName: user.last_name||"", headline: user.headline||"", bio: user.bio||"", location: user.location||"", currentCompany: user.current_company||"", collegeName: user.college_name||"" }); }, [user]);
  const submit = async (e) => { e.preventDefault(); try { await axios.put("/api/users/profile", form); toast.success("Updated!"); setTimeout(() => window.location.reload(), 1000); } catch (err) { toast.error("Failed to update"); } };
  return (
    <div className="page-container" style={{ maxWidth: 600 }}><Toaster />
      <div className="card"><h2>Edit Profile</h2>
        <form onSubmit={submit}>
          <div style={{ display: "flex", gap: "10px" }}><div style={{ flex: 1 }}><label>First Name</label><input className="input-box" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></div><div style={{ flex: 1 }}><label>Last Name</label><input className="input-box" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></div></div>
          <label>College Name</label><input className="input-box" value={form.collegeName} onChange={(e) => setForm({ ...form, collegeName: e.target.value })} required />
          <label>Headline</label><input className="input-box" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Software Engineer" />
          <label>Bio</label><textarea className="input-box" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <label>Location</label><input className="input-box" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. New York, NY" />
          <label>Company</label><input className="input-box" value={form.currentCompany} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} />
          <button className="btn-primary" style={{ width: "100%", marginTop: 15 }}>Save Changes</button>
        </form>
      </div>
    </div>
  );
};

// ==============================
// COMMUNITY FEED (HOMEPAGE)
// ==============================
const PostItem = ({ post, user, onDelete, onRefresh }) => { /* Assuming same logic from previous prompt logic */ }; 

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]); const [content, setContent] = useState(""); const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("latest"); // 🟢 SORT FEATURE ADDED

  const fetchPosts = useCallback(async () => {
    try { const res = await axios.get(`/api/posts?sort=${sortOption}`); setPosts(res.data.posts); } 
    catch (err) { toast.error("Failed to load posts"); } finally { setLoading(false); }
  }, [sortOption]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSubmit = async (e) => {
    e.preventDefault(); try { await axios.post("/api/posts", { content }); setContent(""); fetchPosts(); toast.success("Posted!"); } 
    catch (err) { toast.error("Failed to post"); }
  };
  const handleDelete = async (postId) => {
    if (!window.confirm("Delete post?")) return; try { await axios.delete(`/api/posts/${postId}`); fetchPosts(); toast.success("Deleted"); } 
    catch (err) { toast.error("Failed to delete"); }
  };

  if (loading) return <div className="page-container"><p style={{ textAlign: "center" }}>Loading feed...</p></div>;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}><Toaster />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: "15px" }}>
        <div><h1 style={{ margin: "0 0 5px 0" }}>Welcome back, {user?.first_name || "Alumni"}! 👋</h1><p style={{ margin: 0, color: "#64748b" }}>Here is what's happening in your community today.</p></div>
        <div style={{ display: "flex", gap: "10px" }}><Link to="/alumni" className="btn-secondary" style={{ textDecoration: "none" }}><i className="fas fa-search" style={{ marginRight: 5 }}></i> Find Alumni</Link></div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <textarea className="input-box" rows="3" placeholder="Share an update, ask a question, or post an opportunity..." value={content} onChange={(e) => setContent(e.target.value)} required style={{ resize: "vertical" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            {/* Feed Sort Dropdown */}
            <select className="input-box" value={sortOption} onChange={(e)=>setSortOption(e.target.value)} style={{ width: '150px', marginBottom: 0, padding: '8px' }}>
              <option value="latest">Latest</option><option value="top">Most Liked</option><option value="oldest">Oldest</option>
            </select>
            <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}><i className="fas fa-paper-plane" style={{ marginRight: "8px" }}></i> Post</button>
          </div>
        </form>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {posts.map(post => <PostItem key={post.id} post={post} user={user} onDelete={handleDelete} onRefresh={fetchPosts} />)}
        {posts.length === 0 && <p style={{ textAlign: "center", color: "#6b7280", marginTop: "20px" }}>No posts yet. Break the ice!</p>}
      </div>
    </div>
  );
};

// ==============================
// JOB MODALS (CREATE & EDIT)
// ==============================
const JobFormModal = ({ job, onClose, onSuccess }) => {
  const isEdit = !!job;
  const [form, setForm] = useState(job || { title: "", company: "", description: "", requirements: "", location: "", salaryRange: "", jobType: "Full-time", experienceLevel: "Mid-level" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (isEdit) { await axios.put(`/api/jobs/${job.id}`, form); toast.success("Job updated!"); } 
      else { await axios.post("/api/jobs", form); toast.success("Job posted!"); }
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save job"); setSubmitting(false); }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div className="card" style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0 }}>{isEdit ? "Edit Job" : "Post a Job"}</h2><button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#6b7280" }}>×</button></div>
        <form onSubmit={handleSubmit}>
          <label>Job Title *</label><input className="input-box" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label>Company *</label><input className="input-box" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          <label>Location</label><input className="input-box" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div style={{display:'flex', gap:10}}>
            <div style={{flex:1}}><label>Job Type</label><select className="input-box" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} required><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></div>
            <div style={{flex:1}}><label>Level</label><select className="input-box" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} required><option>Entry-level</option><option>Mid-level</option><option>Senior</option><option>Lead</option></select></div>
          </div>
          <label>Salary Range</label><input className="input-box" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} />
          <label>Job Description *</label><textarea className="input-box" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <label>Requirements</label><textarea className="input-box" rows={4} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}><button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? "Saving..." : "Save Job"}</button><button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>Cancel</button></div>
        </form>
      </div>
    </div>
  );
};

// ==============================
// JOBS PAGE & CARD
// ==============================
const JobCard = ({ job, onJobDeleted }) => {
  const [expanded, setExpanded] = useState(false); const [showApplyModal, setShowApplyModal] = useState(false); const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // 🟢 Edit State
  const { user } = useAuth();
  const handleDeleteJob = async () => { if (window.confirm("Delete job?")) { try { await axios.delete(`/api/jobs/${job.id}`); toast.success("Deleted!"); onJobDeleted(); } catch (err) { toast.error("Failed to delete"); } } };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0, marginBottom: 5 }}>{job.title}</h3><p style={{ color: "#6b7280", marginBottom: 10, fontSize: "16px" }}><strong>{job.company}</strong>{job.location && ` • ${job.location}`}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {job.job_type && <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}>{job.job_type}</span>}
            {job.experience_level && <span style={{ background: "#f3e8ff", color: "#7c3aed", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}>{job.experience_level}</span>}
            {job.salary_range && <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 12px", borderRadius: "6px", fontSize: "14px" }}>{job.salary_range}</span>}
          </div>
          {expanded && (<div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid #eee" }}><h4 style={{ marginTop: 0 }}>Description</h4><p style={{ color: "#4b5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.description}</p>{job.requirements && <><h4 style={{ marginTop: 15 }}>Requirements</h4><p style={{ color: "#4b5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.requirements}</p></>}<p style={{ color: "#6b7280", fontSize: "14px", marginTop: 15 }}>Posted by: {job.first_name} {job.last_name}</p></div>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 15, flexWrap: "wrap" }}>
        {user?.id !== job.posted_by && <button className="btn-primary" onClick={() => setShowApplyModal(true)}>Apply Now</button>}
        <button className="btn-secondary" onClick={() => setExpanded(!expanded)}>{expanded ? "Show Less" : "View Details"}</button>
        {user?.id === job.posted_by && <button className="btn-primary" onClick={() => setShowApplicationsModal(true)}>Applications ({job.application_count || 0})</button>}
        
        {/* EDIT BUTTON (Only Owner or Admin) */}
        {(user?.id === job.posted_by || user?.role === 'admin') && <button className="btn-secondary" onClick={() => setShowEditModal(true)}><i className="fas fa-edit"></i> Edit</button>}
        
        {(user?.id === job.posted_by || user?.role === 'admin') && <button className="btn-danger" onClick={handleDeleteJob}><i className="fas fa-trash"></i></button>}
      </div>
      {showEditModal && <JobFormModal job={job} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); onJobDeleted(); }} />}
      {showApplyModal && <ApplyJobModal job={job} onClose={() => setShowApplyModal(false)} onSuccess={() => { setShowApplyModal(false); onJobDeleted(); }} />}
      {showApplicationsModal && <ViewApplicationsModal job={job} onClose={() => setShowApplicationsModal(false)} />}
    </div>
  );
};

const JobsPage = () => {
  const [jobs, setJobs] = useState([]); const [loading, setLoading] = useState(true); const [showCreateModal, setShowCreateModal] = useState(false);
  const loadJobs = useCallback(async () => { try { const res = await axios.get("/api/jobs"); setJobs(res.data.jobs || []); } catch (err) { toast.error("Failed to load jobs"); } finally { setLoading(false); } }, []);
  useEffect(() => { loadJobs(); }, [loadJobs]);

  if (loading) return <div className="page-container"><div style={{ textAlign: "center", marginTop: "50px", color: "#6b7280" }}><i className="fas fa-spinner fa-spin fa-2x"></i><p>Loading jobs...</p></div></div>;
  return (
    <div className="page-container"><Toaster />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h1>Job Board</h1><button className="btn-primary" onClick={() => setShowCreateModal(true)}><i className="fas fa-plus"></i> Post Job</button></div>
      {showCreateModal && <JobFormModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadJobs(); }} />}
      {jobs.length === 0 ? <div className="card"><p style={{ textAlign: "center", color: "#6b7280" }}>No jobs posted yet.</p></div> : <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>{jobs.map((job) => <JobCard key={job.id} job={job} onJobDeleted={loadJobs} />)}</div>}
    </div>
  );
};

// ==============================
// OTHER PAGES OMITTED FOR SPACE (Dashboard, Alumni, Connections, Admin)
// Assuming they remain the exact same minified structure from the previous blocks!
// ==============================
const DashboardPage = () => { /* Same as previous */ };
const AdminPanel = () => { /* Same as previous */ };
const AlumniList = () => { /* Same as previous */ };
const ConnectionsPage = () => { /* Same as previous */ };
const MessagesPage = () => { /* Same as previous */ };
const AlumniProfile = () => { /* Same as previous */ };

// MAIN APP
function App() {
  return (
    <Router><AuthProvider><Routes>
      <Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/verify-otp" element={<VerifyOtp />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
    </Routes></AuthProvider></Router>
  );
}

export default App;
