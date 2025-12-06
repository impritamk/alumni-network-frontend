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
      padding: "10px 20px",
      borderBottom: "1px solid #ddd",
      background: "#fff"
    }}>
      <strong>Alumni Network</strong>

      <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
        <Link to="/alumni">Alumni</Link>
        <Link to="/messages">Messages</Link>
        <Link to="/jobs">Jobs</Link>
        <Link to="/profile/edit">Profile</Link>

        <span>Hi, {user?.first_name}</span>
        <button className="btn-danger" onClick={doLogout}>Logout</button>
      </div>
    </div>
  );
}
