// src/pages/NotFoundPage.js
import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="page-container" style={{ textAlign: "center", marginTop: "10vh" }}>
      
      {/* --- CSS ANIMATIONS JUST FOR THIS PAGE --- */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
          @keyframes spinSlow {
            100% { transform: rotate(360deg); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
          .animate-spin {
            animation: spinSlow 8s linear infinite;
            display: inline-block;
          }
        `}
      </style>

      {/* --- ANIMATED 404 TEXT --- */}
      <div className="animate-float">
        <h1 style={{ 
          fontSize: "clamp(80px, 15vw, 140px)", 
          margin: "0", 
          color: "var(--primary)", 
          lineHeight: "1",
          textShadow: "0px 15px 25px rgba(37, 99, 235, 0.2)" 
        }}>
          4<i className="fas fa-compass animate-spin" style={{ color: "var(--text-muted)", fontSize: "0.8em", margin: "0 10px" }}></i>4
        </h1>
      </div>
      
      <h2 style={{ marginTop: "30px", fontSize: "28px", color: "var(--text-main)" }}>
        Looks like you're lost!
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "16px", maxWidth: "450px", margin: "15px auto 30px", lineHeight: "1.6" }}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable in the campus network.
      </p>
      
      <Link to="/" className="btn-primary" style={{ display: "inline-block", padding: "14px 32px", fontSize: "16px", borderRadius: "30px", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)" }}>
        <i className="fas fa-home" style={{ marginRight: "8px" }}></i> Return to Base
      </Link>
    </div>
  );
};

export default NotFoundPage;
