// src/pages/SinglePostPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth, PageSkeleton } from "../App";
import { PostItem } from "../components/PostItem";

const SinglePostPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPost = useCallback(async () => {
    try {
      const res = await axios.get(`/api/posts/${id}`);
      setPost(res.data.post);
    } catch (err) { 
      toast.error("Failed to load post"); 
      navigate("/");
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleDelete = async (postId) => { 
    if (!window.confirm("Delete post?")) return; 
    try { 
      await axios.delete(`/api/posts/${postId}`); 
      toast.success("Deleted"); 
      navigate("/");
    } catch (err) { toast.error("Failed to delete"); } 
  };

  if (loading) return <PageSkeleton />;
  if (!post) return null;

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Toaster />
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", marginBottom: "15px", fontWeight: "bold" }}>
        <i className="fas fa-arrow-left"></i> Back
      </button>
      <PostItem post={post} user={user} onDelete={handleDelete} onRefresh={fetchPost} defaultShowComments={true} isSingleView={true} />
    </div>
  );
};

export default SinglePostPage;
