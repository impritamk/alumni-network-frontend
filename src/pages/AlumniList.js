import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function AlumniList() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    try {
      const res = await axios.get("/api/users/directory");
      setAlumni(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load alumni");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter((person) => {
    const matchesSearch = 
      person.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      person.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      person.headline?.toLowerCase().includes(search.toLowerCase());
    
    const matchesYear = !yearFilter || person.passout_year == yearFilter;
    
    return matchesSearch && matchesYear;
  });

  if (loading) {
    return <div className="page-container">Loading alumni...</div>;
  }

  return (
    <div className="page-container">
      <h1>Alumni Directory</h1>

      {/* Search and Filter */}
      <div className="card">
        <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
          <input
            className="input-box"
            placeholder="Search by name or headline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            className="input-box"
            type="number"
            placeholder="Filter by year..."
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ width: 200 }}
          />
          {(search || yearFilter) && (
            <button 
              className="btn-secondary"
              onClick={() => { setSearch(""); setYearFilter(""); }}
            >
              Clear
            </button>
          )}
        </div>
        <p style={{ color: "#6b7280" }}>
          Showing {filteredAlumni.length} of {alumni.length} alumni
        </p>
      </div>

      {/* Alumni List */}
      <div className="grid-3">
        {filteredAlumni.length === 0 ? (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <p style={{ textAlign: "center", color: "#6b7280" }}>
              No alumni found. Try adjusting your search.
            </p>
          </div>
        ) : (
          filteredAlumni.map((person) => (
            <div key={person.id} className="card">
              <h3 style={{ marginTop: 0 }}>
                {person.first_name} {person.last_name}
              </h3>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                {person.headline || "Alumni"}
              </p>
              <p style={{ fontSize: "14px", marginBottom: 15 }}>
                <strong>Batch:</strong> {person.passout_year || "N/A"}
              </p>
              <Link 
                to={`/alumni/${person.id}`} 
                className="btn-primary"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                View Profile
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
