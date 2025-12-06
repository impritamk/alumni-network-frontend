// src/components/AlumniProfile.js
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function AlumniProfile() {
  const { id } = useParams();
  const [alumnus, setAlumnus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`/api/alumni/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setAlumnus(res.data);
      })
      .catch((err) => {
        console.error("Error fetching alumni profile:", err.response?.data || err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="mt-6 text-center">Loading profile...</p>;
  if (!alumnus) return <p className="mt-6 text-center">Alumni not found.</p>;

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-1">{alumnus.name}</h1>
        <p className="text-gray-600 mb-1">{alumnus.headline}</p>
        <p className="text-gray-500 text-sm mb-4">
          Batch of {alumnus.passout_year}
        </p>

        <p className="mb-4">{alumnus.bio || "No bio added yet."}</p>

        {/* Step 1: UI only – follow/chat backend will come later */}
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-md text-sm bg-indigo-600 text-white">
            Follow
          </button>
          <button className="px-4 py-2 rounded-md text-sm border">
            Message
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlumniProfile;
