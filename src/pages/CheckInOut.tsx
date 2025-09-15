import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserPlus, Users, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/api/http";

const CheckInOut = () => {
  const [activeTab, setActiveTab] = useState<"check" | "create">("check");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ Check In/Out form state
  const [checkForm, setCheckForm] = useState({
    phone: "",
    pin: "",
    action: "check_in",
    location: "",
  });

  // ✅ Create User form state
  const [userForm, setUserForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "manager",
  });

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCheckForm({ ...checkForm, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/access/", checkForm);
      toast({ title: "Success", description: "Action recorded successfully ✅" });
      setCheckForm({ phone: "", pin: "", action: "check_in", location: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to record action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
       // Redirect after check-in/out
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/create/", userForm);
      toast({ title: "Success", description: "User created successfully 🎉" });
      setUserForm({ name: "", phone: "", email: "", role: "manager" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      navigate("/welcome");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link to="/dashboard" className="group">
            <Button variant="outline" size="sm" className="interactive-hover">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-primary">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Check In / Out</h1>
              <p className="text-muted-foreground">Manage access and user creation</p>
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="p-1 bg-white shadow-lg rounded-xl">
            <div className="flex">
              <Button
                variant={activeTab === "check" ? "default" : "ghost"}
                onClick={() => setActiveTab("check")}
                className={`${activeTab === "check" ? "bg-primary text-primary-foreground" : ""} px-8 py-3 rounded-lg font-medium`}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Check In/Out
              </Button>
              <Button
                variant={activeTab === "create" ? "default" : "ghost"}
                onClick={() => setActiveTab("create")}
                className={`${activeTab === "create" ? "bg-primary text-primary-foreground" : ""} px-8 py-3 rounded-lg font-medium`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          {activeTab === "check" ? (
            <Card className="card-enhanced interactive-hover">
              <CardHeader className="pb-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary">
                  <LogOut className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">Check In / Out</CardTitle>
                <CardDescription>Record visitor or staff movement</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCheckSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={checkForm.phone} onChange={handleCheckChange} required className="h-12 focus-enhanced" />
                  </div>
                  <div>
                    <Label htmlFor="pin">PIN</Label>
                    <Input id="pin" name="pin" type="password" value={checkForm.pin} onChange={handleCheckChange} required className="h-12 focus-enhanced" />
                  </div>
                  <div>
                    <Label htmlFor="action">Action</Label>
                    <select id="action" name="action" value={checkForm.action} onChange={handleCheckChange} className="w-full h-12 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="check_in">Check In</option>
                      <option value="check_out">Check Out</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={checkForm.location} onChange={handleCheckChange} required className="h-12 focus-enhanced" />
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-medium transition-all bg-primary hover:opacity-90" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                    {loading ? "Processing..." : "Submit"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="card-enhanced interactive-hover">
              <CardHeader className="pb-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary">
                  <UserPlus className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">Create User</CardTitle>
                <CardDescription>Add a new user to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <input
                      name="name"
                      value={userForm.name}
                      onChange={handleUserChange}
                      placeholder="Full Name"
                      required
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={userForm.phone} onChange={handleUserChange} required className="h-12 focus-enhanced" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={userForm.email} onChange={handleUserChange} className="h-12 focus-enhanced" />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select id="role" name="role" value={userForm.role} onChange={handleUserChange} className="w-full h-12 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="visitor">Visitor</option>
                    </select>
                  </div>

                  <Button type="submit" className="w-full h-12 text-base font-medium transition-all bg-primary hover:opacity-90" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    {loading ? "Creating..." : "Create User"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInOut;