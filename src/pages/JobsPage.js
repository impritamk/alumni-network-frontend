// src/pages/JobsPage.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../App"; // Connects back to your auth logic

// --- JOB FORM MODAL ---
const JobFormModal = ({ job, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isEdit = !!job; 
  const [form, setForm] = useState(job ? { ...job, applyLink: job.apply_link || "" } : { title: "", company: "", description: "", requirements: "", location: "", salaryRange: "", jobType: "Full-time", experienceLevel: "Mid-level", applyLink: "" });
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e) => { 
    e.preventDefault();
    if (user?.email === 'alumninetworkplatform@gmail.com') {
      toast.error("🔒 Please create an account to post or edit jobs!");
      return; 
    } 
    setSubmitting(true); 
    try { 
      if (isEdit) { 
        await axios.put(`/api/jobs/${job.id}`, form); 
        toast.success("Job updated!"); 
      } else { 
        await axios.post("/api/jobs", form); 
        toast.success("Job posted!"); 
      } 
      onSuccess(); 
    } catch (err) { 
      toast.error(err.response?.data?.message || "Failed to save job"); 
      setSubmitting(false); 
    } 
  };
  
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div className="card" style={{ maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{isEdit ? "Edit Job" : "Post a Job"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Job Title *</label><input className="input-box" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label>Company *</label><input className="input-box" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          <label>Location</label><input className="input-box" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div style={{display:'flex', gap:10}}>
            <div style={{flex:1}}>
              <label>Job Type</label>
              <select className="input-box" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} required>
                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
              </select>
            </div>
            <div style={{flex:1}}>
              <label>Level</label>
              <select className="input-box" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} required>
                <option>Entry-level</option><option>Mid-level</option><option>Senior</option><option>Lead</option>
              </select>
            </div>
          </div>
          <label>Salary Range</label><input className="input-box" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} />
          <label>Application Link (URL) *</label>
          <input className="input-box" type="url" value={form.applyLink || ""} onChange={(e) => setForm({ ...form, applyLink: e.target.value })} required placeholder="https://careers.company.com/..." />
          <label>Job Description *</label><textarea className="input-box" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <label>Requirements</label><textarea className="input-box" rows={4} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>{submitting ? "Saving..." : "Save Job"}</button>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose} disabled={submitting}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- JOB CARD ---
const JobCard = ({ job, onJobDeleted }) => {
  const [expanded, setExpanded] = useState(false); 
  const [showEditModal, setShowEditModal] = useState(false); 
  const { user } = useAuth();
  
  const handleDeleteJob = async () => { 
    if (window.confirm("Delete job?")) { 
      try { 
        await axios.delete(`/api/jobs/${job.id}`); 
        toast.success("Deleted!"); 
        onJobDeleted(); 
      } catch (err) { toast.error("Failed to delete"); } 
    } 
  };
  
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0, marginBottom: 5 }}>{job.title}</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 10, fontSize: "16px" }}><strong>{job.company}</strong>{job.location && ` • ${job.location}`}</p>
          
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            {job.job_type && <span className="job-tag job-tag-blue"><i className="fas fa-briefcase"></i> {job.job_type}</span>}
            {job.experience_level && <span className="job-tag job-tag-purple"><i className="fas fa-chart-line"></i> {job.experience_level}</span>}
            {job.salary_range && <span className="job-tag job-tag-green"><i className="fas fa-money-bill-wave"></i> {job.salary_range}</span>}
          </div>
          
           {expanded && (
              <div style={{ marginTop: 15, paddingTop: 15, borderTop: "1px solid var(--border-color)" }}>
                <h4 style={{ marginTop: 0 }}>Description</h4><p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.description}</p>
                {job.requirements && <><h4 style={{ marginTop: 15 }}>Requirements</h4><p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{job.requirements}</p></>}
                
                {job.apply_link && (
                  <div style={{ marginTop: 15, padding: "10px", background: "var(--bg-color)", borderRadius: "6px" }}>
                    <h4 style={{ margin: "0 0 5px 0", fontSize: "13px", color: "var(--text-muted)" }}>Application Link:</h4>
                    <a href={job.apply_link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", wordBreak: "break-all", fontSize: "14px" }}>
                      {job.apply_link}
                    </a>
                  </div>
                )}
                
                <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: 15 }}>Posted by: {job.first_name} {job.last_name}</p>
              </div>
            )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 15, flexWrap: "wrap" }}>
        
        {user?.id !== job.posted_by && job.apply_link && (
          <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Apply Now <i className="fas fa-external-link-alt" style={{ marginLeft: 8, fontSize: "12px" }}></i>
          </a>
        )}
        
        <button className="btn-secondary" onClick={() => setExpanded(!expanded)}>{expanded ? "Show Less" : "View Details"}</button>
        
        {(user?.id === job.posted_by || user?.role === 'admin') && <button className="btn-secondary" onClick={() => setShowEditModal(true)}><i className="fas fa-edit"></i> Edit</button>}
        {(user?.id === job.posted_by || user?.role === 'admin') && <button className="btn-danger" onClick={handleDeleteJob}><i className="fas fa-trash"></i></button>}
      </div>
      
      {showEditModal && <JobFormModal job={job} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); onJobDeleted(); }} />}
    </div>
  );
};

// --- MAIN JOBS PAGE ---
const JobsPage = () => {
  const [jobs, setJobs] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const loadJobs = useCallback(async () => { 
    try { 
      const res = await axios.get("/api/jobs"); 
      setJobs(res.data.jobs || []); 
    } catch (err) { toast.error("Failed to load jobs"); } 
    finally { setLoading(false); } 
  }, []);
  
  useEffect(() => { loadJobs(); }, [loadJobs]);
  
  if (loading) return <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>Loading jobs...</div>;
    
  return (
    <div className="page-container"><Toaster />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>Job Board</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}><i className="fas fa-plus"></i> Post Job</button>
      </div>
      {showCreateModal && <JobFormModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadJobs(); }} />}
      {jobs.length === 0 ? <div className="card"><p style={{ textAlign: "center", color: "var(--text-muted)" }}>No jobs posted yet.</p></div> : <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>{jobs.map((job) => <JobCard key={job.id} job={job} onJobDeleted={loadJobs} />)}</div>}
    </div>
  );
};

export default JobsPage;
