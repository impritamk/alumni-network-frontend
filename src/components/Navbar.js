// src/components/Navbar.js
import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    "px-3 py-2 text-sm font-medium " +
    (isActive ? "underline" : "text-gray-900");

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-xl font-semibold">Alumni Network</div>

        <div className="flex gap-3 items-center">
          <NavLink to="/alumni" className={linkClass}>
            Alumni
          </NavLink>
          <NavLink to="/messages" className={linkClass}>
            Messages
          </NavLink>
          <NavLink to="/jobs" className={linkClass}>
            Jobs
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-md text-sm font-medium bg-red-500 text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
