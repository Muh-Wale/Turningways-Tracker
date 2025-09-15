import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Settings,
  Shield,
  BarChart3,
  LogOutIcon,
  QrCode,
  Bell,
  Building,
  Smartphone,
  ArrowRight,
  Star,
  Zap,
  BarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import trackar from "../assets/trackar.png";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const isAdmin = isAuthenticated && user && user.role !== "visitor";

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="flex-1">
        <div className="container px-4 py-8 mx-auto">
          {/* Header */}
          <div className="flex flex-col mb-8 lg:flex-row lg:justify-between lg:items-start">
            {/* Clock */}
            <div className="flex justify-center mb-6 lg:justify-start lg:mb-0">
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-primary">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-sm text-grey-600">
                    {formatDate(currentTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Right Buttons */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              {isAdmin && (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center w-full sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                  >
                    <BarChart className="w-4 h-4 mr-2" />
                    <span className="text-sm">Dashboard</span>
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/usercheck" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center w-full sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Register Visitor</span>
                  </Button>
                </Link>
              )}
              {/* ✅ Admin Login always visible */}
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="flex items-center justify-center w-full sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="text-sm">Admin Login</span>
                </Button>
              </Link>
              {isAdmin && (
                <Button
                  onClick={logout}
                  variant="outline"
                  className="flex items-center justify-center w-full sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                >
                  <LogOutIcon className="w-4 h-4 mr-2" />
                  <span className="text-sm">Logout</span>
                </Button>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="mb-16 text-center">
            <div className="flex items-center justify-center mb-6">
              <img
                src={trackar}
                alt="Trackar Logo"
                className="object-contain w-48 h-12"
                style={{ width: "200px", height: "50px" }}
              />
            </div>
            <h1 className="mb-4 text-5xl font-bold text-grey-900">
              Modern Access Control
            </h1>
            <p className="max-w-2xl mx-auto mb-8 text-xl text-grey-600">
              Streamline visitor management, enhance security, and gain
              real-time insights with our comprehensive access control platform
            </p>

            <div className="flex flex-col justify-center gap-4 mt-8 sm:flex-row">
              {/* ✅ Get Started now goes to /register */}
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div id="features" className="py-16">
            <h2 className="mb-12 text-3xl font-bold text-center text-grey-900">
              Powerful Features for Modern Security
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <QrCode className="w-8 h-8 text-primary" />,
                  title: "QR Code Access",
                  desc: "Generate unique QR codes for secure visitor entry",
                },
                {
                  icon: <Shield className="w-8 h-8 text-primary" />,
                  title: "Role-based Access",
                  desc: "Fine-grained access control for different user roles",
                },
                {
                  icon: <BarChart3 className="w-8 h-8 text-primary" />,
                  title: "Analytics Dashboard",
                  desc: "Real-time insights into visitor patterns and access logs",
                },
                {
                  icon: <Bell className="w-8 h-8 text-primary" />,
                  title: "Instant Notifications",
                  desc: "Get notified when visitors check in or out",
                },
                {
                  icon: <Building className="w-8 h-8 text-primary" />,
                  title: "Multi-Tenant Support",
                  desc: "Perfect for residential complexes and office buildings",
                },
                {
                  icon: <Smartphone className="w-8 h-8 text-primary" />,
                  title: "Mobile Friendly",
                  desc: "Works seamlessly across all devices and screen sizes",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="p-6 transition bg-white border rounded-lg shadow-sm hover:shadow-md"
                >
                  {f.icon}
                  <h3 className="mt-4 mb-2 text-xl font-semibold">{f.title}</h3>
                  <p className="text-grey-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="py-16 bg-primary-50">
            <div className="grid max-w-4xl grid-cols-2 gap-8 mx-auto text-center md:grid-cols-4">
              {[
                { value: "10K+", label: "Visitors Tracked" },
                { value: "500+", label: "Active Tenants" },
                { value: "99.9%", label: "Uptime Guarantee" },
                { value: "24/7", label: "Support" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-3xl font-bold text-primary">
                    {s.value}
                  </div>
                  <div className="text-grey-600">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className="py-16">
            <h2 className="mb-12 text-3xl font-bold text-center text-grey-900">
              How It Works
            </h2>
            <div className="grid max-w-5xl gap-8 mx-auto md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Register",
                  desc: "Create your organization and set up access rules",
                },
                {
                  step: "2",
                  title: "Invite",
                  desc: "Send QR codes to visitors or employees",
                },
                {
                  step: "3",
                  title: "Track",
                  desc: "Monitor access in real-time from your dashboard",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-6 text-center transition bg-white border rounded-lg shadow-sm hover:shadow-md"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-4 text-lg font-bold text-white rounded-full bg-primary">
                    {s.step}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{s.title}</h3>
                  <p className="text-grey-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="py-16 bg-grey-50">
            <h2 className="mb-12 text-3xl font-bold text-center text-grey-900">
              Trusted by Businesses & Communities
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Property Manager",
                  quote:
                    "Trackar has transformed how we manage visitor access in our residential community. The QR system is seamless!",
                },
                {
                  name: "Michael Chen",
                  role: "Security Director",
                  quote:
                    "The analytics dashboard gives us unprecedented visibility into building access patterns. Highly recommended.",
                },
                {
                  name: "David Wilson",
                  role: "Office Administrator",
                  quote:
                    "Easy to set up, intuitive to use, and our employees love the convenience of QR-based access.",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="p-6 transition bg-white border rounded-lg shadow-sm hover:shadow-md"
                >
                  <Star className="w-6 h-6 mb-4 text-primary" />
                  <p className="mb-4 text-grey-600">"{t.quote}"</p>
                  <div className="font-semibold text-grey-900">{t.name}</div>
                  <div className="text-sm text-grey-600">{t.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="py-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-grey-900">
              Ready to Modernize Your Access Control?
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-lg text-grey-600">
              Join thousands of organizations already using Trackar to enhance
              security and streamline visitor management
            </p>
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Get Started Now <Zap className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-white border-t">
        <div className="container flex flex-col items-center justify-between px-4 mx-auto md:flex-row">
          <div className="mb-4 md:mb-0">
            <img src={trackar} alt="Trackar Logo" className="h-8" />
          </div>
          <div className="flex gap-6 text-sm text-grey-600">
            <Link to="#">Privacy Policy</Link>
            <Link to="#">Terms of Service</Link>
            <Link to="#">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
