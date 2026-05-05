// src/pages/NotFoundPage.js
import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="page-container" style={{ textAlign: "center", marginTop: "10vh" }}>
      <h1 style={{ fontSize: "80px", margin: "0", color: "var(--primary)" }}>404</h1>
      <h2 style={{ marginTop: "10px" }}>Page Not Found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
        Looks like this page got lost in the campus network.
      </p>
      <Link to="/" className="btn-primary" style={{ display: "inline-block" }}>
        Return to Feed
      </Link>
    </div>
  );
};

export default NotFoundPage;
