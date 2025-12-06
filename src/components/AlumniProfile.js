import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function AlumniProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get(`/api/users/${id}`)
      .then(res => setUser(res.data.user))
      .catch(() => alert("User not found"));
  }, [id]);

  if (!user) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="card">
        <h2>{user.first_name} {user.last_name}</h2>
        <p>{user.headline}</p>
        <p><b>Batch:</b> {user.passout_year}</p>
        <p>{user.bio}</p>

        <div style={{ marginTop: 15 }}>
          <button className="btn-primary">Connect</button>
          <button style={{ marginLeft: 10 }} className="btn-secondary">
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
