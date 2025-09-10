
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Settings, Shield, BarChart3, LogOutIcon } from "lucide-react";
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

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isAdmin = isAuthenticated && user && user.role !== "visitor";

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary-50 to-white">
            <div className="flex-1">
                <div className="container px-4 py-8 mx-auto">
                    {/* Header - Mobile Responsive */}
                    <div className="flex flex-col mb-8 lg:flex-row lg:justify-between lg:items-start">
                        {/* Clock - Top Left on Desktop, Centered on Mobile */}
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

                        {/* Top Right Buttons - Mobile Responsive */}
                        
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                            {isAdmin && (
                                <Link to="/dashboard" className="w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className="flex items-center justify-center w-full sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        <span className="text-sm">Dashboard</span>
                                    </Button>
                                </Link>
                            )}
                            {/* {isAdmin && (
                                <Link to="/usercheck" className="w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className="flex items-center justify-center w-full sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        <span className="text-sm">Register as Visitor</span>
                                    </Button>
                                </Link>
                            )} */}
                            <Link to="/login" className="w-full sm:w-auto">
                                <Button variant="outline" className="flex items-center justify-center w-full sm:w-auto border-grey-300 hover:bg-grey-50 hover:text-primary-500">
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

                    {/* Centered Logo and Tagline */}
                    <div className="mb-12 text-center">
                        <div className="flex items-center justify-center mb-4">
                            <img
                                src={trackar}
                                alt="Trackar Logo"
                                className="object-contain w-48 h-12"
                                style={{ width: '200px', height: '50px' }}
                            />
                        </div>
                        <p className="max-w-2xl mx-auto text-xl text-grey-600">
                            Simple Access, Smarter Control
                        </p>
                    </div>

                    {/* Welcome Section */}
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="mb-6 text-4xl font-bold text-grey-900">
                            Welcome to Trackar
                        </h1>
                        <p className="mb-8 text-lg text-grey-600">
                            A comprehensive access control system designed for modern workplaces to enable facility security, visitor management, and access control
                        </p>

                    </div>

                    {/* Features Section */}
                    <div className="max-w-4xl mx-auto mt-16">

                        <div className="grid gap-6 md:grid-cols-4">
                            {/* Smart Access Control */}
                            <div className="p-6 text-center bg-white rounded-lg shadow-md">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg">
                                    <Shield className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-grey-900">Smart Access Control</h3>
                                <p className="text-grey-600">
                                    Advanced check-in/check-out system with multiple authentication methods and real-time access monitoring
                                </p>
                            </div>

                            {/* Visitor Management */}
                            <div className="p-6 text-center bg-white rounded-lg shadow-md">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-grey-900">Visitor Management</h3>
                                <p className="text-grey-600">
                                    Streamlined visitor registration, appointment scheduling, and purpose tracking for secure facility access
                                </p>
                            </div>

                            {/* Real-time Monitoring & Analytics */}
                            <div className="p-6 text-center bg-white rounded-lg shadow-md">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg">
                                    <BarChart3 className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-grey-900">Real-time Monitoring & Analytics</h3>
                                <p className="text-grey-600">
                                    Comprehensive logging, visitor trends, security insights, and detailed reporting dashboard
                                </p>
                            </div>

                            {/* Admin Center */}
                            <div className="p-6 text-center bg-white rounded-lg shadow-md">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-lg">
                                    <Settings className="w-6 h-6 text-orange-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-grey-900">Admin Center</h3>
                                <p className="text-grey-600">
                                    Complete administrative control with user management, system settings, and security configuration
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-3 mt-12 bg-white border-t border-grey-200">
                <div className="container px-4 mx-auto">
                    <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-grey-600">Powered by</span>
                            <a
                                href="https://turningways.website"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold transition-colors text-primary hover:text-primary-700"
                            >
                                TATS
                            </a>
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link to="/terms" className="text-sm transition-colors text-grey-600 hover:text-primary">
                                Terms of Use
                            </Link>
                            <span className="text-sm text-grey-500">
                                © {new Date().getFullYear()} Trackar
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;
