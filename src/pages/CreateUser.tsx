import React, { useState } from "react";
import api from "@/api/http";
import { useNavigate } from "react-router-dom";

const CreateUser: React.FC = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "manager" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/create/", form); // ✅ matches backend schema
      alert("User created!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error creating user");
    } finally {
      setLoading(false);
      navigate("/welcome");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 space-y-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold">Create User</h2>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full Name"
          required
          className="w-full p-2 border rounded-lg"
        />

        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          required
          className="w-full p-2 border rounded-lg"
        />

        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border rounded-lg"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        >
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="visitor">Visitor</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 text-white bg-green-600 rounded-lg"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
};

export default CreateUser;