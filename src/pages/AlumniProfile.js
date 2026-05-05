// src/pages/AlumniProfile.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth, PageSkeleton } from "../App";
import { PostItem } from "../components/PostItem";

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
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Guest accounts cannot send connection requests."); return; }
    try { 
      setLoading(true); await axios.post(`/api/connections/${userId}/request`); setStatus("pending"); toast.success("Connection request sent!"); 
    } catch (err) { if (err.response?.status === 409) { toast.error(err.response.data.message); } else { toast.error("Failed to send connection request"); } } 
    finally { setLoading(false); } 
  };

  const handleRemove = async () => { 
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Guest accounts cannot modify connections."); return; }
    if (window.confirm("Are you sure you want to remove this connection?")) { 
      try { setLoading(true); await axios.delete(`/api/connections/${userId}`); setStatus("not_connected"); toast.success("Connection removed"); } catch (err) { toast.error("Failed to remove connection"); } finally { setLoading(false); } 
    } 
  };

  const handleMessage = () => { navigate(`/messages?userId=${userId}`); };

  if (loading) return <button className="btn-primary" disabled><i className="fas fa-spinner fa-spin"></i></button>;
  if (status === "accepted") return ( <div style={{ display: "flex", gap: 8 }}><button className="btn-primary" onClick={handleMessage}><i className="fas fa-comment-dots" style={{ marginRight: 5 }}></i> Message</button><button className="btn-danger" onClick={handleRemove}><i className="fas fa-times" style={{ marginRight: 5 }}></i> Disconnect</button></div> );
  if (status === "pending") return ( <button className="btn-cancel" onClick={handleRemove}><i className="fas fa-times" style={{ marginRight: 5 }}></i> Cancel Request</button> );
  return ( <button className="btn-primary" onClick={handleConnect}><i className="fas fa-user-plus" style={{ marginRight: 5 }}></i> Connect</button> );
};

const AlumniProfile = () => {
  const { id } = useParams(); 
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const fetchUserPosts = useCallback(async () => {
    try { const res = await axios.get(`/api/users/${id}/posts`); setUserPosts(res.data.posts); } catch (err) { console.error("Failed to load user posts"); } finally { setPostsLoading(false); }
  }, [id]);

  useEffect(() => { 
    const fetchUser = async () => { 
      setLoading(true); setError(null); 
      try { const res = await axios.get(`/api/users/${id}`); setProfileUser(res.data.user); } catch (err) { setError(err.response?.data?.message || "Failed to load user profile"); } finally { setLoading(false); } 
    }; 
    fetchUser(); 
    fetchUserPosts(); 
  }, [id, fetchUserPosts]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete post?")) return; 
    try { await axios.delete(`/api/posts/${postId}`); toast.success("Deleted"); fetchUserPosts(); } catch (err) { toast.error("Failed to delete"); } 
  };

  if (loading) return <PageSkeleton />;
  if (error || !profileUser) return <div className="page-container"><Toaster /><div className="card" style={{ textAlign: "center" }}><h2><i className="fas fa-user-slash" style={{ color: "var(--danger)", marginRight: 10 }}></i>User Not Found</h2><p style={{ color: "var(--text-muted)", marginBottom: 15 }}>{error || "This user profile could not be found."}</p><Link to="/alumni" className="btn-primary" style={{ display: "inline-block" }}>Back to Alumni List</Link></div></div>;
  
  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Toaster />
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>{profileUser.first_name} {profileUser.last_name} {profileUser.role === 'admin' && <span className="admin-badge" style={{ marginLeft: "10px" }}>ADMIN</span>}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "18px", marginTop: 5, marginBottom: 10 }}>{profileUser.headline || "Alumni"}</p>
            {profileUser.open_to && ( <span style={{ display: "inline-block", background: "#f3e8ff", color: "#7c3aed", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", marginBottom: "15px" }}><i className="fas fa-hands-helping" style={{ marginRight: "6px" }}></i> Open To: {profileUser.open_to}</span> )}
          </div>
          <div style={{ display: "flex", gap: "15px" }}>
            {profileUser.linkedin_url && ( <a href={profileUser.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0077b5", fontSize: "28px", transition: "transform 0.2s" }} title="LinkedIn Profile"><i className="fab fa-linkedin"></i></a> )}
            {profileUser.github_url && ( <a href={profileUser.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-main)", fontSize: "28px", transition: "transform 0.2s" }} title="GitHub/Portfolio"><i className="fab fa-github"></i></a> )}
          </div>
        </div>
        
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

        {profileUser.bio && ( <div style={{ marginTop: 25, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}><h3 style={{ marginTop: 0 }}>About</h3><p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{profileUser.bio}</p></div> )}
        {currentUser && String(currentUser.id) !== String(id) && ( <div style={{ marginTop: 25, display: "flex", gap: 10 }}><ConnectButton userId={id} /></div> )}
      </div>
      
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}><i className="fas fa-pencil-alt" style={{ color: "var(--primary)" }}></i> Recent Posts by {profileUser.first_name}</h3>
        {postsLoading ? ( <p style={{ color: "var(--text-muted)" }}>Loading posts...</p> ) : userPosts.length === 0 ? ( <div className="card" style={{ textAlign: "center", background: "transparent", border: "1px dashed var(--border-color)", boxShadow: "none" }}><p style={{ color: "var(--text-muted)", margin: 0 }}>This user hasn't posted anything yet.</p></div> ) : (
           <div style={{ display: "flex", flexDirection: "column" }}>
             {userPosts.map(post => ( <PostItem key={post.id} post={post} user={currentUser} onDelete={handleDeletePost} onRefresh={fetchUserPosts} /> ))}
           </div>
        )}
      </div>

      <Link to="/alumni" className="text-blue" style={{ display: "inline-block", marginTop: 20, fontSize: "16px", fontWeight: "600" }}>← Back to Directory</Link>
    </div>
  );
};

export default AlumniProfile;
