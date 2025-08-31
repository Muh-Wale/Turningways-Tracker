// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/api/http";
import trackar from "../assets/trackar.png";

export default function Register() {
  const [form, setForm] = useState({
    organization_name: "",
    phone: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await api.post("/register/", form);

    toast({
      title: "Registration Successful",
      description: res.data.message || "Your organization has been registered.",
    });

    navigate("/login");
  } catch (err: any) {
    console.error("Registration error:", err.response?.data || err.message);

    let description = "Registration failed. Please try again.";

    // Handle Django validation errors (form.errors dict)
    if (err?.response?.status === 400 && err.response?.data) {
      const errors = err.response.data;
      if (typeof errors === "object") {
        description = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(", ")}`)
          .join(" | ");
      }
    } else if (err?.response?.data?.message) {
      // Handle normal error with "message"
      description = err.response.data.message;
    } else if (err.message) {
      description = err.message;
    }

    toast({
      title: "Registration Failed",
      description,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-grey-50 to-white">
      <div className="w-full max-w-md px-4">
        <div className="mb-4 text-center">
          <Link
            to="/welcome"
            className="inline-flex items-center text-lg font-semibold text-blue-800 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img
                src={trackar}
                alt="Trackar Logo"
                className="object-contain"
                style={{ width: "200px", height: "50px" }}
              />
            </div>
            <CardTitle className="text-2xl">Register Organization</CardTitle>
            <CardDescription>
              Fill in your details to create an account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="organization_name">Organization Name</Label>
                <Input
                  id="organization_name"
                  name="organization_name"
                  type="text"
                  value={form.organization_name}
                  onChange={handleChange}
                  placeholder="Enter your organization name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="text"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1234567890"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  required
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-700"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-2 text-sm text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-blue-800 hover:underline"
          >
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}