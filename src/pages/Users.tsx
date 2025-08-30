import { useEffect, useState } from "react";
import api from "@/api/http";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "manager" });

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users/create/", form);
      setForm({ name: "", phone: "", email: "", role: "manager" });
      fetchUsers();
    } catch (err) {
      console.error("Failed to create user", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Users</h1>

      <form onSubmit={handleSubmit} className="max-w-md mt-4 space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
        <button className="px-4 py-2 text-white bg-blue-600 rounded">Create User</button>
      </form>

      <ul className="mt-6 space-y-2">
        {users.map((u, i) => (
          <li key={i} className="p-3 border rounded bg-gray-50">
            {u.name} ({u.role}) - {u.phone}
          </li>
        ))}
      </ul>
    </div>
  );
}
