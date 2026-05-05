// src/pages/AlumniList.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { PageSkeleton } from "../App";

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
  
  useEffect(() => {
    const delaySearch = setTimeout(() => { loadAlumni(searchTerm); }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchTerm]); 

  return (
    <div className="page-container">
      <Toaster />
      <h1>Alumni Directory</h1>
      
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <i className="fas fa-search" style={{ color: "var(--text-muted)", marginLeft: "10px" }}></i>
          <input type="text" className="input-box" placeholder="Search by name, email, or batch (e.g., 2026)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: 0, flex: 1, border: "none", boxShadow: "none", background: "transparent" }} />
        </div>
      </div>

      {loading ? <PageSkeleton /> : (
        <div className="grid-3">
          {alumni.map((person) => (
            <div key={person.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0" }}>{person.first_name} {person.last_name}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "0 0 10px 0", lineHeight: "1.4" }}>{person.headline || "Alumni"}</p>
                <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569", fontWeight: "600" }}>Batch {person.passout_year}</span>
              </div>
              <Link to={`/alumni/${person.id}`} className="btn-secondary" style={{ textDecoration: "none", display: "block", textAlign: "center", marginTop: "15px" }}>View Profile</Link>
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

export default AlumniList;
