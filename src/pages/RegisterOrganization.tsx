import React, { useState } from "react";
import api from "@/api/http";
import { useNavigate } from "react-router-dom";

const RegisterOrganization: React.FC = () => {
  const [formData, setFormData] = useState({
    organization_name: "",
    phone: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/register/", formData);
      setPin(res.data.pin);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold">Register Organization</h2>
        {["organization_name", "first_name", "last_name", "phone", "email"].map(
          (field) => (
            <input
              key={field}
              name={field}
              type="text"
              placeholder={field.replace("_", " ")}
              value={(formData as any)[field]}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg"
            />
          )
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Registering..." : "Register"}
        </button>
        {pin && (
          <p className="mt-3 text-green-600 font-medium">
            Super Admin PIN: {pin}
          </p>
        )}
      </form>
    </div>
  );
};

export default RegisterOrganization;
