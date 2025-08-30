// src/pages/Login.tsx
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
import { useAuth } from "@/context/AuthContext";
import trackar from "../assets/trackar.png";

export default function Login() {
  const [form, setForm] = useState({ phone: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.phone, form.pin);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      navigate("/welcome");
    } catch (err: any) {
      const description =
        err?.response?.data?.message ||
        err.message ||
        "Invalid phone or PIN. Please try again.";

      toast({
        title: "Login Failed",
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
            <CardTitle className="text-2xl">User Login</CardTitle>
            <CardDescription>
              Login with your phone number and PIN to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="text"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. 09035439887"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  name="pin"
                  type="password"
                  value={form.pin}
                  onChange={handleChange}
                  placeholder="Enter your PIN"
                  required
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-700"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-2 text-sm text-center">
          Don't have an account? Register {""}
          <Link
            to="/register"
            className="inline-flex items-center text-sm text-blue-800 hover:underline"
          >
             here
          </Link>
        </div>
      </div>
    </div>
  );
}
