import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../App"; // your AuthContext

export default function EditProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        headline: user.headline || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put("/api/users/profile", form);
      toast.success("Profile updated!");
      window.location.href = "/";
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Toaster />
      <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">

        <input
          className="w-full p-2 border rounded"
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Headline"
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
        />

        <textarea
          className="w-full p-2 border rounded"
          placeholder="Bio"
          rows="4"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}
