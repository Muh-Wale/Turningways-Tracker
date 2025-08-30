// src/pages/TestAuth.tsx
import React, { useState } from "react";
import api from "../api/http"; // your Axios instance

export default function TestAuth() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/login/", { phone, pin });
      const { access, refresh } = res.data;

      // Save tokens
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      setMessage("✅ Logged in! Access token saved.");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "❌ Login failed.");
    }
  };

  const handleTestProtected = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) return setMessage("⚠️ No access token found.");

      const res = await api.get("/protected-route/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("🔒 Protected route success: " + JSON.stringify(res.data));
    } catch (err: any) {
      setMessage("❌ Protected route failed (maybe token expired).");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white shadow-lg rounded-2xl">
        <h2 className="mb-4 text-xl font-bold text-center">Test Auth</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <button
          onClick={handleTestProtected}
          className="w-full py-2 mt-4 text-white transition bg-green-600 rounded-lg hover:bg-green-700"
        >
          Test Protected API
        </button>

        {message && (
          <p className="mt-4 text-sm text-center text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}
