// src/pages/EditProfile.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../App"; 

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

export default EditProfile;
