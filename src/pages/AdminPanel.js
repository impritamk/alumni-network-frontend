// src/pages/AdminPanel.js
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth, PageSkeleton } from "../App"; 

const EMAIL_TEMPLATES = [
  {
    subject: "Hello World! (It's been a while) 👋",
    message: "Just a quick ping to see how you are doing!\n\nThe ConnectAlumni network has been growing, and your batchmates are missing you. We have some fresh job postings and new conversations happening right now.\n\nTake a quick break from your screen and come say hi!"
  },
  {
    subject: "Error 404: Alumni Not Found 🔍",
    message: "We ran a search for you on the network recently, but you were nowhere to be found!\n\nDon't worry, we saved your spot. The Chaibasa Engineering community has been sharing some great new job referrals and interview tips this week.\n\nLog back in and let us know what you've been working on lately!"
  },
  {
    subject: "While your code is compiling... ⏳",
    message: "...why not check in with your college network?\n\nWe know you are busy, but there are some new job opportunities and alumni discussions waiting for you. It only takes a minute to see what’s new.\n\nGrab some water, stretch your legs, and come see what your batchmates are up to!"
  }
];

const getRandomTemplate = () => {
  return EMAIL_TEMPLATES[Math.floor(Math.random() * EMAIL_TEMPLATES.length)];
};

const AdminPanel = () => {
  const { user } = useAuth(); 
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailForm, setEmailForm] = useState({
    targetEmail: "",
    ...getRandomTemplate() 
  });
  
  const fetchUsers = async (search = "") => { 
    try { 
      setLoading(true); 
      const res = await axios.get(`/api/admin/users?search=${search}`); 
      setUsers(res.data.users); 
    } catch (err) { toast.error("Failed to load users"); } 
    finally { setLoading(false); } 
  };
  
  useEffect(() => { fetchUsers(); }, []);
  
  const handleSearch = (e) => { e.preventDefault(); fetchUsers(searchTerm); };
  
  const handleToggleBan = async (targetUser) => { 
    const action = targetUser.is_banned ? "unban" : "ban"; 
    if (!window.confirm(`Are you sure you want to ${action} ${targetUser.first_name}?`)) return; 
    try { 
      await axios.patch(`/api/admin/users/${targetUser.id}/${action}`); 
      toast.success(`User successfully ${action}ned`); 
      fetchUsers(searchTerm); 
    } catch (err) { toast.error("Failed"); } 
  };
  
  const handleRoleChange = async (targetUser) => { 
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin'; 
    if (!window.confirm(`Make ${targetUser.first_name} a ${newRole}?`)) return; 
    try { 
      await axios.patch(`/api/admin/users/${targetUser.id}/role`, { role: newRole }); 
      toast.success(`Updated`); 
      fetchUsers(searchTerm); 
    } catch (err) { toast.error("Failed"); } 
  };

  const shuffleTemplate = (e) => {
    e.preventDefault();
    const newTemp = getRandomTemplate();
    setEmailForm(prev => ({ ...prev, subject: newTemp.subject, message: newTemp.message }));
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!emailForm.targetEmail.trim()) {
      const confirmed = window.confirm("🚨 WARNING: You left the target email blank. This will send an email to EVERY verified user on the platform. Are you sure?");
      if (!confirmed) return;
    }

    setIsEmailing(true);
    try {
      await axios.post("/api/admin/broadcast-email", {
        targetEmail: emailForm.targetEmail.trim() || undefined,
        subject: emailForm.subject,
        message: emailForm.message
      });
      toast.success("Emails successfully sent!");
      setEmailForm({ targetEmail: "", ...getRandomTemplate() });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send emails");
    } finally {
      setIsEmailing(false);
    }
  };
  
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  
  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <Toaster />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <i className="fas fa-shield-alt" style={{ fontSize: "28px", color: "#dc2626" }}></i>
        <h1 style={{ margin: 0 }}>Admin Panel</h1>
      </div>

      <div className="card" style={{ marginBottom: "30px", borderLeft: "4px solid #8b5cf6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fas fa-paper-plane" style={{ color: "#8b5cf6" }}></i> Send Custom Email Broadcast
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
              Write a custom message, or cycle through our templates. Leave "Target Email" blank to email <strong>everyone</strong>.
            </p>
          </div>
          
          <button onClick={shuffleTemplate} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "13px" }} type="button">
            🎲 Shuffle Template
          </button>
        </div>
        
        <form onSubmit={handleSendBroadcast}>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 250px" }}>
              <label>Target Email (Optional)</label>
              <input className="input-box" type="email" placeholder="Leave blank for ALL users..." value={emailForm.targetEmail} onChange={(e) => setEmailForm({...emailForm, targetEmail: e.target.value})} disabled={isEmailing} />
            </div>
            <div style={{ flex: "1 1 350px" }}>
              <label>Email Subject *</label>
              <input className="input-box" type="text" value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} required disabled={isEmailing} />
            </div>
          </div>
          
          <label>Message Body *</label>
          <textarea className="input-box" rows="5" value={emailForm.message} onChange={(e) => setEmailForm({...emailForm, message: e.target.value})} required disabled={isEmailing} style={{ resize: "vertical" }} />
          
          <button type="submit" className="btn-primary" disabled={isEmailing} style={{ background: "#8b5cf6", width: "100%", marginTop: "10px" }}>
            {isEmailing ? (
              <><i className="fas fa-spinner fa-spin" style={{ marginRight: 5 }}></i> Sending Emails...</>
            ) : (
              <><i className="fas fa-envelope" style={{ marginRight: 5 }}></i> Send Broadcast</>
            )}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Manage Users</h3>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input type="text" className="input-box" placeholder="Search by name, email, or batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: 0, flex: 1 }} />
          <button type="submit" className="btn-primary">Search</button>
        </form>
        {loading ? <PageSkeleton /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: "15px", borderBottom: "1px solid var(--border-color)", gap: "10px" }}>
                <div>
                  <strong>{u.first_name} {u.last_name}</strong> 
                  <span style={{ color: "var(--text-muted)", marginLeft: 10 }}>{u.email}</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: 10 }}>• Batch {u.passout_year}</span>
                  {u.role === 'admin' && <span className="admin-badge">ADMIN</span>}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {u.id !== user.id && <button onClick={() => handleRoleChange(u)} className="btn-secondary">{u.role === 'admin' ? "Remove Admin" : "Make Admin"}</button>}
                  {u.role !== 'admin' && <button onClick={() => handleToggleBan(u)} className="btn-danger">{u.is_banned ? "Unban" : "Ban"}</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
