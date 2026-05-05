// src/pages/FeedPage.js
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Toaster />
      {showPostModal && ( <CreatePostModal onClose={() => setShowPostModal(false)} onSuccess={() => { setShowPostModal(false); setPage(1); fetchPosts(1, true); }} /> )}
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30, flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ margin: "0 0 5px 0" }}>Welcome back, {user?.first_name || "Alumni"}! 👋</h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Here is what's happening in your community today.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setShowPostModal(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}><i className="fas fa-edit"></i> Create Post</button>
          <Link to="/alumni" className="btn-secondary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}><i className="fas fa-search"></i> Alumni</Link>
          <Link to="/jobs" className="btn-secondary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}><i className="fas fa-briefcase"></i> Jobs</Link>
        </div>
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
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ marginTop: '30px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}>
          <i className="fas fa-arrow-up"></i> Back to top
        </button>
      </div>
    </div>
  );
};

export default FeedPage;
