// src/components/PostItem.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Microlink from '@microlink/react';

export const PostItem = ({ post, user, onDelete, isSingleView = false }) => {
  const [currentPost, setCurrentPost] = useState(post);
  const [showComments, setShowComments] = useState(isSingleView); 
  const [commentText, setCommentText] = useState(""); 
  const [isLiking, setIsLiking] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => { setCurrentPost(post); }, [post]);

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = currentPost.content.match(urlRegex);
  const firstUrl = urls ? urls[0] : null; 

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const ytId = firstUrl ? getYouTubeId(firstUrl) : null;

  const handleLike = async () => { 
    if (isLiking) return; 
    setIsLiking(true); 
    
    const wasLiked = currentPost.user_liked;
    setCurrentPost(prev => ({
      ...prev,
      user_liked: !wasLiked,
      like_count: wasLiked ? parseInt(prev.like_count) - 1 : parseInt(prev.like_count) + 1
    }));

    try { 
      await axios.post(`/api/posts/${currentPost.id}/like`); 
    } catch (err) { 
      setCurrentPost(post);
      toast.error("Failed to like post"); 
    } 
    finally { setIsLiking(false); } 
  };
  
  const handleComment = async (e) => { 
    e.preventDefault(); 
    if (!commentText.trim()) return; 
    try { 
      const res = await axios.post(`/api/posts/${currentPost.id}/comments`, { content: commentText }); 
      
      const newComment = {
        id: res.data.comment.id,
        content: res.data.comment.content,
        created_at: res.data.comment.created_at,
        user_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      };

      setCurrentPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
      setCommentText(""); 
    } catch (err) { toast.error("Failed to post comment"); } 
  };
  
  const handleDeleteComment = async (commentId) => { 
    if (!window.confirm("Delete this comment?")) return; 
    
    setCurrentPost(prev => ({
      ...prev,
      comments: prev.comments.filter(c => c.id !== commentId)
    }));

    try { 
      await axios.delete(`/api/posts/comments/${commentId}`); 
    } catch (err) { 
      setCurrentPost(post); 
      toast.error("Failed to delete comment"); 
    } 
  };

  const handleShare = () => {
    const link = `${window.location.origin}/post/${currentPost.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleCardClick = () => {
    if (!isSingleView) navigate(`/post/${currentPost.id}`);
  };
  
  return (
    <div className="card" onClick={handleCardClick} style={{ marginBottom: "15px", cursor: !isSingleView ? "pointer" : "default", transition: "transform 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="post-header" onClick={(e) => { e.stopPropagation(); navigate(`/alumni/${currentPost.user_id}`); }} style={{ cursor: "pointer", display: "flex", gap: "10px" }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {currentPost.first_name[0]}
          </div>
          <div>
            <h4 style={{ margin: "0 0 2px 0", color: "inherit", display: "flex", alignItems: "center" }}>
              {currentPost.first_name} {currentPost.last_name}
              {currentPost.role === 'admin' && <span className="admin-badge">ADMIN</span>}
            </h4>
            <span className="college-display" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chaibasa Engineering College</span>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
              {new Date(currentPost.created_at).toLocaleDateString('en-GB')} at {new Date(currentPost.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        {(user?.role === 'admin' || user?.id === currentPost.user_id) && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(currentPost.id); }} className="btn-danger" style={{ padding: "4px 10px", fontSize: "12px" }}><i className="fas fa-trash"></i></button>
        )}
      </div>
      
      <p style={{ margin: "15px 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{currentPost.content}</p>
      
      {firstUrl && ytId ? (
        <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: "15px", borderRadius: "8px", overflow: "hidden", position: "relative", paddingTop: "56.25%", border: "1px solid var(--border-color)" }}>
          <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} src={`https://www.youtube.com/embed/${ytId}`} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
        </div>
      ) : firstUrl ? (
        <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: "15px", overflow: "hidden", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <Microlink url={firstUrl} style={{ width: '100%', border: 'none', borderRadius: '8px' }} size="large" />
        </div>
      ) : null}
      
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "15px", borderTop: "1px solid var(--border-color)", paddingTop: "10px", flexWrap: "wrap" }}>
        <button onClick={handleLike} disabled={isLiking} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: currentPost.user_liked ? "var(--danger)" : "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className={currentPost.user_liked ? "fas fa-heart" : "far fa-heart"}></i> {currentPost.like_count || 0} Likes
        </button>
        <button onClick={() => setShowComments(!showComments)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className="far fa-comment"></i> {currentPost.comments?.length || 0} Comments
        </button>
        <button onClick={handleShare} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontWeight: "bold", fontSize: "14px" }}>
          <i className="fas fa-share"></i> Share
        </button>
      </div>

      {showComments && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: "15px", background: "var(--bg-color)", padding: "15px", borderRadius: "8px" }}>
          <form onSubmit={handleComment} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input type="text" className="input-box" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ marginBottom: 0, flex: 1 }} />
            <button type="submit" className="btn-primary" disabled={!commentText.trim()}>Post</button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {currentPost.comments && currentPost.comments.length > 0 ? (currentPost.comments.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", background: "var(--card-bg)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <div>
                  <strong style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "5px", cursor: 'pointer' }} onClick={() => navigate(`/alumni/${c.user_id}`)}>
                    {c.first_name} {c.last_name} {c.role === 'admin' && <span className="admin-badge">ADMIN</span>}
                  </strong>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>{new Date(c.created_at).toLocaleDateString('en-GB')}</span>
                <p style={{ margin: 0, fontSize: "14px" }}>{c.content}</p>
                </div>
                {(user?.role === 'admin' || user?.id === c.user_id) && <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", alignSelf: "flex-start", padding: "5px" }}><i className="fas fa-times"></i></button>}
              </div>
            ))) : (<p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>No comments yet.</p>)}
          </div>
        </div>
      )}
    </div>
  );
};
