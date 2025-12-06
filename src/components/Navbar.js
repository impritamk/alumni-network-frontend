import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";

export default function Navbar() {
  console.log("🔍 Navbar component rendering"); // Debug log
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  console.log("👤 Current user:", user); // Debug log

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 30px",
      borderBottom: "2px solid #ddd",
      background: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <Link to="/" style={{ textDecoration: "none", color: "#000", fontSize: "18px" }}>
        <strong>🎓 Alumni Network</strong>
      </Link>
      
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <Link to="/" className="text-blue">Home</Link>
        <Link to="/alumni" className="text-blue">Alumni</Link>
        <Link to="/messages" className="text-blue">Messages</Link>
        <Link to="/jobs" className="text-blue">Jobs</Link>
        <Link to="/profile/edit" className="text-blue">Profile</Link>
        <span style={{ color: "#6b7280", fontWeight: "500" }}>
          Hi, {user?.first_name || user?.firstName || "User"}
        </span>
        <button className="btn-danger" onClick={doLogout}>Logout</button>
      </div>
    </div>
  );
}
