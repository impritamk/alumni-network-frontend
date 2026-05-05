// src/pages/DashboardPage.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { useAuth } from "../App"; // Connects back to your auth logic

const DashboardPage = () => {
  const { user } = useAuth(); 
  const [stats, setStats] = useState({ alumniCount: 0, activeJobs: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [batchmates, setBatchmates] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  
  useEffect(() => { 
    const loadDashboardData = async () => { 
      try { 
        // 1. Fetch aggregate stats and pending connections using existing routes
        const [alumniRes, jobsRes, pendingRes] = await Promise.all([ 
          axios.get("/api/users/directory?limit=100"), 
          axios.get("/api/jobs"),
          axios.get("/api/connections/pending-requests")
        ]); 
        
        const allAlumni = alumniRes.data.users || [];
        const allJobs = jobsRes.data.jobs || [];

        setStats({ alumniCount: allAlumni.length, activeJobs: allJobs.length });
        
        // 2. Grab just the 3 newest jobs for the snapshot
        setRecentJobs(allJobs.slice(0, 3)); 
        setPendingCount(pendingRes.data.pending?.length || 0);

        // 3. Find batchmates (people who graduated the same year)
        if (user?.passout_year) {
          const batchRes = await axios.get(`/api/users/directory?passoutYear=${user.passout_year}`);
          // Filter out the current user, and take the first 4
          const peers = (batchRes.data.users || []).filter(u => u.id !== user.id).slice(0, 4);
          setBatchmates(peers);
        }
      } catch (err) { console.error("Dashboard load error", err); } 
    }; 
    if (user) loadDashboardData(); 
  }, [user]);
  
  return (
    <div className="page-container" style={{ maxWidth: "1000px" }}>
      <Toaster />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>Dashboard</h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Welcome back to your command center.</p>
        </div>
        <Link to="/profile/edit" className="btn-secondary" style={{ fontSize: "14px", padding: "8px 16px" }}>
          <i className="fas fa-edit" style={{ marginRight: "5px" }}></i> Edit Profile
        </Link>
      </div>

      {/* --- ACTIONABLE ALERTS --- */}
      {pendingCount > 0 && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "15px 20px", borderRadius: "8px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1d4ed8", fontWeight: "600" }}>
            <i className="fas fa-user-friends" style={{ fontSize: "20px" }}></i>
            You have {pendingCount} new connection request{pendingCount > 1 ? 's' : ''} waiting!
          </div>
          <button onClick={() => navigate("/connections")} className="btn-primary" style={{ padding: "6px 12px", fontSize: "13px" }}>Review</button>
        </div>
      )}

      {/* --- QUICK STATS (Refined) --- */}
      <div className="grid-3" style={{ marginBottom: 30 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#e0f2fe", color: "#2563eb", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}><i className="fas fa-users"></i></div>
          <div><p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)" }}>Network Size</p><h2 style={{ margin: 0, fontSize: "28px" }}>{stats.alumniCount}</h2></div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#f3e8ff", color: "#7c3aed", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}><i className="fas fa-briefcase"></i></div>
          <div><p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)" }}>Active Jobs</p><h2 style={{ margin: 0, fontSize: "28px" }}>{stats.activeJobs}</h2></div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: 0 }}>
          <div style={{ background: "#dcfce7", color: "#15803d", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}><i className="fas fa-id-badge"></i></div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-muted)" }}>Status</p>
            <h3 style={{ margin: "2px 0", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.headline || "Headline not set"}</h3>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: "30px" }}>
        
        {/* --- BATCHMATES SECTION --- */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>Batch of {user?.passout_year}</h3>
            <Link to="/alumni" className="text-blue" style={{ fontSize: "13px", fontWeight: "600" }}>View All Directory →</Link>
          </div>
          <div className="card" style={{ padding: "0" }}>
            {batchmates.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", margin: 0 }}>No other batchmates registered yet. Invite them!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {batchmates.map((peer, index) => (
                  <div key={peer.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", borderBottom: index < batchmates.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                     <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{peer.first_name[0]}</div>
                        <div>
                        <h4 style={{ margin: 0 }}>{peer.first_name} {peer.last_name}</h4>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{peer.headline || "Alumni"}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/alumni/${peer.id}`)} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>Profile</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- LATEST JOBS SECTION --- */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0 }}>Recent Opportunities</h3>
            <Link to="/jobs" className="text-blue" style={{ fontSize: "13px", fontWeight: "600" }}>Go to Job Board →</Link>
          </div>
          <div className="card" style={{ padding: "0" }}>
            {recentJobs.length === 0 ? (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", margin: 0 }}>No jobs posted yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recentJobs.map((job, index) => (
                  <div key={job.id} style={{ padding: "15px 20px", borderBottom: index < recentJobs.length - 1 ? "1px solid var(--border-color)" : "none", cursor: "pointer" }} onClick={() => navigate("/jobs")}>
                    <h4 style={{ margin: "0 0 5px 0", color: "var(--primary)" }}>{job.title}</h4>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "500" }}>{job.company} {job.location && <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>• {job.location}</span>}</p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569", fontWeight: "600" }}>{job.job_type}</span>
                      <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569", fontWeight: "600" }}>{job.experience_level}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
