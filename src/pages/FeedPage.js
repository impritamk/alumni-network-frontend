// src/pages/FeedPage.js
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth, PageSkeleton } from "../App";
import { PostItem } from "../components/PostItem";

const CreatePostModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.email === 'alumninetworkplatform@gmail.com') { toast.error("🔒 Please register a full account to post on the feed!"); return; }
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Create a Post</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "var(--text-muted)", lineHeight: "1" }}>×</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: 45, height: 45, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: "18px", fontWeight: 'bold' }}>{user?.first_name ? user.first_name[0] : "A"}</div>
          <div>
            <h4 style={{ margin: 0, fontSize: "16px" }}>{user?.first_name} {user?.last_name}</h4>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Posting to ConnectAlumni</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <textarea className="input-box" rows="8" placeholder="What do you want to talk about? Share an update, ask a question, or post a resource link..." value={content} onChange={(e) => setContent(e.target.value)} required style={{ resize: "none", fontSize: "16px", padding: "15px", lineHeight: "1.5", flex: 1, minHeight: "150px" }} autoFocus />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 15 }}>
            <button type="submit" className="btn-primary" disabled={submitting || !content.trim()} style={{ padding: "12px 24px", fontSize: "16px", borderRadius: "24px" }}>{submitting ? "Posting..." : "Post"}</button>
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
  const [showPostModal, setShowPostModal] = useState(false); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // --- NEW: State for the Sidebar Inbox ---
  const [recentChats, setRecentChats] = useState([]);
  const navigate = useNavigate();

  const LIMIT = 10;
  
  const fetchPosts = useCallback(async (pageNum = 1, isNewSort = false) => { 
    try { 
      if (pageNum === 1 && isNewSort) setLoading(true);
      const res = await axios.get(`/api/posts?sort=${sortOption}&page=${pageNum}&limit=${LIMIT}`); 
      if (pageNum === 1) { setPosts(res.data.posts); } else { setPosts(prev => [...prev, ...res.data.posts]); }
      setHasMore(res.data.posts.length === LIMIT);
    } catch (err) { toast.error("Failed to load posts"); } 
    finally { setLoading(false); } 
  }, [sortOption]);
  
  // --- NEW: Fetch recent chats when the page loads ---
  useEffect(() => {
    const fetchSidebarInbox = async () => {
      try {
        const res = await axios.get("/api/inbox");
        // Grab only the 3 most recent conversations for the sidebar
        setRecentChats((res.data.rooms || []).slice(0, 3));
      } catch (err) {
        console.error("Failed to load sidebar inbox");
      }
    };
    if (user) fetchSidebarInbox();
  }, [user]);
  
  useEffect(() => { setPage(1); fetchPosts(1, true); }, [sortOption, fetchPosts]);
  
  const loadMore = () => { const nextPage = page + 1; setPage(nextPage); fetchPosts(nextPage, false); };

  const refreshAllLoadedPosts = async () => {
    try {
      const res = await axios.get(`/api/posts?sort=${sortOption}&page=1&limit=${page * LIMIT}`);
      setPosts(res.data.posts);
    } catch (err) { console.error("Failed to silently refresh posts"); }
  };
  
  const handleDelete = async (postId) => { 
    if (!window.confirm("Delete post?")) return; 
    try { 
      await axios.delete(`/api/posts/${postId}`); 
      setPage(1); fetchPosts(1, true); toast.success("Deleted"); 
    } catch (err) { toast.error("Failed to delete"); } 
  };

  if (loading) return <PageSkeleton />;
  
  return (
    <div className="page-container" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Toaster />
      {showPostModal && ( <CreatePostModal onClose={() => setShowPostModal(false)} onSuccess={() => { setShowPostModal(false); setPage(1); fetchPosts(1, true); }} /> )}
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "25px", alignItems: "flex-start", justifyContent: "center" }}>
        
        {/* ========================================================= */}
        {/* COLUMN 1: THE MAIN FEED */}
        {/* ========================================================= */}
        <div style={{ flex: "1 1 600px", maxWidth: "700px", width: "100%" }}>
          
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ margin: "0 0 5px 0" }}>Welcome back, {user?.first_name || "Alumni"}! 👋</h2>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>Here is what's happening in your community today.</p>
          </div>

          <div className="card" onClick={() => setShowPostModal(true)} style={{ display: "flex", gap: "15px", alignItems: "center", padding: "15px 20px", marginBottom: "20px", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}>
             <div style={{ width: 45, height: 45, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold" }}>
               {user?.first_name ? user.first_name[0] : "A"}
             </div>
             <div style={{ flex: 1, background: "var(--bg-color)", padding: "14px 20px", borderRadius: "30px", color: "var(--text-muted)", border: "1px solid var(--border-color)", fontWeight: "500", fontSize: "15px" }}>
               Start a post or share an update...
             </div>
             <i className="fas fa-pencil-alt" style={{ color: "var(--primary)", fontSize: "20px" }}></i>
          </div>

          {posts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
              <select className="input-box" value={sortOption} onChange={(e)=>setSortOption(e.target.value)} style={{ width: '140px', marginBottom: 0, padding: '8px 12px', background: "var(--card-bg)" }}>
                <option value="latest">Latest</option><option value="top">Most Liked</option><option value="oldest">Oldest</option>
              </select>
            </div>
          )}
          
          <div style={{ display: "flex", flexDirection: "column" }}>
            {posts.map(post => <PostItem key={post.id} post={post} user={user} onDelete={handleDelete} onRefresh={refreshAllLoadedPosts} />)}
            {posts.length === 0 && <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>No posts yet. Break the ice!</p>}
            {hasMore && posts.length > 0 && ( <button onClick={loadMore} className="btn-secondary" style={{ width: '100%', marginTop: '15px', padding: '12px', fontWeight: 'bold' }}>Load More Posts</button> )}
            {!hasMore && posts.length > 0 && ( <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px", fontSize: "14px" }}>You have reached the end of the feed.</p> )}
          </div>
        </div>


        {/* ========================================================= */}
        {/* COLUMN 2: THE STICKY SIDEBAR */}
        {/* ========================================================= */}
        <div style={{ flex: "1 1 300px", maxWidth: "350px", width: "100%", position: "sticky", top: "20px", display: "flex", flexDirection: "column", gap: "20px", margin: "0 auto" }}>
          
          <div className="card" style={{ padding: "25px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(to right, var(--primary), #8b5cf6)" }}></div>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg-color)", border: "4px solid var(--card-bg)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "bold", margin: "20px auto 10px", position: "relative", zIndex: 2 }}>
              {user?.first_name ? user.first_name[0] : "A"}
            </div>
            <h3 style={{ margin: "0 0 5px 0", fontSize: "18px" }}>{user?.first_name} {user?.last_name}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 15px 0", lineHeight: "1.4" }}>{user?.headline || "Add a headline to your profile so people know what you do!"}</p>
            <Link to="/profile/edit" className="btn-secondary" style={{ display: "block", fontSize: "13px", padding: "8px" }}>Edit Profile</Link>
          </div>

          <div className="card" style={{ padding: "20px" }}>
             <h4 style={{ margin: "0 0 15px 0", color: "var(--text-main)" }}>Explore Network</h4>
             <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
               <Link to="/alumni" style={{ textDecoration: "none", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "12px", fontWeight: "500", transition: "color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                 <i className="fas fa-users" style={{ width: 24, fontSize: "18px" }}></i> Alumni Directory
               </Link>
               <Link to="/jobs" style={{ textDecoration: "none", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "12px", fontWeight: "500", transition: "color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                 <i className="fas fa-briefcase" style={{ width: 24, fontSize: "18px" }}></i> Job Board
               </Link>
               <Link to="/connections" style={{ textDecoration: "none", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "12px", fontWeight: "500", transition: "color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}>
                 <i className="fas fa-user-friends" style={{ width: 24, fontSize: "18px" }}></i> My Connections
               </Link>
             </div>
          </div>

          {/* --- NEW: RECENT CHATS CARD --- */}
          <div className="card" style={{ padding: "20px" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
               <h4 style={{ margin: 0, color: "var(--text-main)" }}>Recent Chats</h4>
               <Link to="/messages" style={{ fontSize: "12px", color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>View All</Link>
             </div>
             
             <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
               {recentChats.length > 0 ? recentChats.map(chat => (
                 <div 
                    key={chat.room.id} 
                    onClick={() => navigate(`/messages?userId=${chat.otherUser.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" }} 
                    onMouseOver={(e) => e.currentTarget.style.background = "var(--bg-color)"} 
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                 >
                   <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", position: "relative" }}>
                     {chat.otherUser.first_name[0]}
                     {chat.hasUnread && <span style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, background: "#ef4444", borderRadius: "50%", border: "2px solid var(--card-bg)" }}></span>}
                   </div>
                   <div style={{ flex: 1, overflow: "hidden" }}>
                     <h5 style={{ margin: 0, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.otherUser.first_name} {chat.otherUser.last_name}</h5>
                     <p style={{ margin: 0, fontSize: "12px", color: chat.hasUnread ? "#ef4444" : "var(--text-muted)", fontWeight: chat.hasUnread ? "bold" : "normal" }}>
                       {chat.hasUnread ? "New message!" : "Tap to chat"}
                     </p>
                   </div>
                 </div>
               )) : (
                 <div style={{ textAlign: "center", padding: "10px 0" }}>
                   <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>No recent conversations.</p>
                   <Link to="/connections" className="text-blue" style={{ fontSize: "12px", display: "block", marginTop: "5px" }}>Find someone to message</Link>
                 </div>
               )}
             </div>
          </div>

          <div style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", padding: "0 10px" }}>
            <p>ConnectAlumni is a private network for Chaibasa Engineering College.</p>
            <p>© {new Date().getFullYear()} All rights reserved.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginTop: '10px' }}>
              <i className="fas fa-arrow-up"></i> Back to top
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default FeedPage;
