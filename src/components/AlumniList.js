import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function AlumniList() {
  const [list, setList] = useState([]);

  useEffect(() => {
    axios.get("/api/users/directory")
      .then(res => setList(res.data.users))
      .catch(() => alert("Failed to load alumni"));
  }, []);

  return (
    <div className="page-container">
      <h2 className="heading">Alumni Directory</h2>

      <div className="card">
        {list.map(u => (
          <div key={u.id} style={{
            padding: 10,
            borderBottom: "1px solid #eee"
          }}>
            <Link to={`/alumni/${u.id}`}>
              <strong>{u.first_name} {u.last_name}</strong>
            </Link>
            <div style={{ fontSize: 13, color: "#666" }}>
              {u.headline || `Batch of ${u.passout_year}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
