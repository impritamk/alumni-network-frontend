// src/components/AlumniList.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function AlumniList() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/alumni", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // adjust if your backend uses res.data.alumni, etc.
        setAlumni(res.data);
      })
      .catch((err) => {
        console.error("Error fetching alumni:", err.response?.data || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-6 text-center">Loading alumni...</p>;

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <h1 className="text-2xl font-semibold mb-4">Alumni</h1>

      <div className="bg-white shadow rounded-lg divide-y">
        {alumni.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-500">
            No alumni found.
          </p>
        )}

        {alumni.map((alum) => (
          <Link
            key={alum.id}
            to={`/alumni/${alum.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">{alum.name}</p>
              <p className="text-sm text-gray-500">
                {alum.headline || `Batch of ${alum.passout_year}`}
              </p>
            </div>
            <span className="text-sm text-indigo-600">View Profile →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AlumniList;
