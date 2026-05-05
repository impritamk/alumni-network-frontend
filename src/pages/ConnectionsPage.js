// src/pages/ConnectionsPage.js
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../App"; // Connects back to your auth logic

const ConnectionsPage = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]); 
  const [pending, setPending] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [tab, setTab] = useState("connections");

  const loadConnections = useCallback(async () => { 
    try { 
      const [connRes, pendRes] = await Promise.all([ axios.get("/api/connections?status=accepted"), axios.get("/api/connections/pending-requests") ]); 
      setConnections(connRes.data.connections || []); 
      setPending(pendRes.data.pending || []); 
    } catch (err) { toast.error("Failed to load connections"); } 
    finally { setLoading(false); } 
  }, []);
  
  useEffect(() => { loadConnections(); }, [loadConnections]);
  
  const handleRemoveConnection = async (connectionId) => {
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Guest accounts cannot modify connections."); return; }
    if (window.confirm("Remove this connection?")) { 
      try { 
        await axios.delete(`/api/connections/${connectionId}`); 
        toast.success("Connection removed"); 
        loadConnections(); 
      } catch (err) { toast.error("Failed to remove"); } 
    } 
  };
  
  const handleAccept = async (connectionId) => { 
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Guest accounts cannot modify connections."); return; }
    try { 
      await axios.post(`/api/connections/${connectionId}/accept`); 
      toast.success("Accepted!"); 
      loadConnections(); 
    } catch (err) { toast.error("Failed to accept"); } 
  };

  const handleReject = async (connectionId) => { 
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Guest accounts cannot modify connections."); return; }
    try { 
      await axios.delete(`/api/connections/${connectionId}/reject`); 
      toast.success("Rejected"); 
      loadConnections(); 
    } catch (err) { toast.error("Failed to reject"); } 
  };

  if (loading) return <div style={{ textAlign: "center", padding: "50px", color: "var(--text-muted)" }}>Loading connections...</div>;
    
  return (
    <div className="page-container"><Toaster /><h1>My Network</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "2px solid var(--border-color)" }}>
        <button onClick={() => setTab("connections")} style={{ background: "none", border: "none", padding: "12px 0", fontSize: "16px", fontWeight: tab === "connections" ? "700" : "500", color: tab === "connections" ? "var(--primary)" : "var(--text-muted)", borderBottom: tab === "connections" ? "3px solid var(--primary)" : "none", cursor: "pointer" }}>Connections ({connections.length})</button>
        <button onClick={() => setTab("pending")} style={{ background: "none", border: "none", padding: "12px 0", fontSize: "16px", fontWeight: tab === "pending" ? "700" : "500", color: tab === "pending" ? "var(--primary)" : "var(--text-muted)", borderBottom: tab === "pending" ? "3px solid var(--primary)" : "none", cursor: "pointer" }}>Pending ({pending.length})</button>
      </div>
      
      {tab === "connections" && (
        <div>
          {connections.length === 0 ? ( <div className="card"><p style={{ textAlign: "center", color: "var(--text-muted)" }}>No connections yet.</p></div> ) : (
            <div className="grid-3">
              {connections.map((conn) => (
                <div key={conn.connection_id} className="card">
                  <h3 style={{ marginTop: 0 }}>{conn.first_name} {conn.last_name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{conn.headline || "Alumni"}</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Batch {conn.passout_year}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <Link to={`/alumni/${conn.connected_to}`} className="btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: "13px", padding: "6px" }}>Profile</Link>
                    <button className="btn-cancel" onClick={() => handleRemoveConnection(conn.connected_to)} style={{ flex: 1, fontSize: "13px", padding: "6px" }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {tab === "pending" && (
        <div>
          {pending.length === 0 ? ( <div className="card"><p style={{ textAlign: "center", color: "var(--text-muted)" }}>No pending requests</p></div> ) : (
            <div className="grid-2">
              {pending.map((req) => (
                <div key={req.connection_id} className="card" style={{ background: "var(--bg-color)" }}>
                  <h3 style={{ marginTop: 0, color: "var(--primary)" }}>{req.first_name} {req.last_name}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{req.headline || "Alumni"}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 15 }}>
                    <button className="btn-primary" onClick={() => handleAccept(req.connection_id)} style={{ flex: 1, fontSize: "13px", padding: "8px" }}>Accept</button>
                    <button className="btn-secondary" onClick={() => handleReject(req.connection_id)} style={{ flex: 1, fontSize: "13px", padding: "8px" }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionsPage;
