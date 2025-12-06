import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      borderBottom: "1px solid #ddd",
      background: "#fff",
      position: "sticky",
      top: 0,
      zIndex: 1000
    }}>
      <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
        <strong>Alumni Network</strong>
      </Link>
      
      <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
        <Link to="/" className="text-blue">Home</Link>
        <Link to="/alumni" className="text-blue">Alumni</Link>
        <Link to="/messages" className="text-blue">Messages</Link>
        <Link to="/jobs" className="text-blue">Jobs</Link>
        <Link to="/profile/edit" className="text-blue">Profile</Link>
        <span style={{ color: "#6b7280" }}>Hi, {user?.first_name}</span>
        <button className="btn-danger" onClick={doLogout}>Logout</button>
      </div>
    </div>
  );
}
