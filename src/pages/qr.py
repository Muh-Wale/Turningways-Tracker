Since it’s 05:15 AM WAT on Sunday, September 14, 2025, let’s implement QR code-based check-in/out functionality for your kiosk or tablet interface alongside the existing PIN-based method. Your current `CheckInOut` React component handles PIN-based check-in/out via the `/access/` endpoint, and we’ll extend it to support QR code scanning. We’ll assume the QR code contains encoded user data (e.g., `phone` and `pin`) that can be decoded and sent to a new or existing API endpoint (e.g., `/validate-qr/`).

### Approach
1. **QR Code Integration**:
   - Use a QR code scanner library (e.g., `html5-qrcode` or `@zxing/library`) to scan QR codes.
   - Decode the QR code to extract `phone` and `pin`, then use this data to populate the check-in/out form or send it directly to the server.

2. **API Endpoint**:
   - Your `views.py` already has a `ValidateQRView` for QR-based validation. We’ll align the frontend with this endpoint.

3. **UI Updates**:
   - Add a QR code scanning tab or toggle alongside the existing PIN and user creation tabs.
   - Include a video feed for scanning and a button to trigger the scan.

4. **State Management**:
   - Manage QR scan results in state and handle the submission process similarly to the PIN method.

### Implementation

#### Step 1: Install Dependencies
Add a QR code scanning library. For this example, we’ll use `html5-qrcode`:
```bash
npm install html5-qrcode
```

#### Step 2: Update `CheckInOut` Component
Modify the component to include QR code scanning functionality.

```jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserPlus, Users, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/api/http";
import Html5QrcodePlugin from "./Html5QrcodePlugin"; // Custom component for QR scanning (see below)

const CheckInOut = () => {
  const [activeTab, setActiveTab] = useState<"check" | "qr" | "create">("check");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const qrCodeResult = useRef({ phone: "", pin: "" }); // Store QR scan result

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

  const handleCheckChange = (e) => {
    setCheckForm({ ...checkForm, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e) => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleCheckSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/access/", checkForm);
      toast({ title: "Success", description: "Action recorded successfully ✅" });
      setCheckForm({ phone: "", pin: "", action: "check_in", location: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to record action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQRSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const qrData = {
        phone: qrCodeResult.current.phone,
        pin: qrCodeResult.current.pin,
        action: checkForm.action,
        location: checkForm.location,
      };
      await api.post("/validate-qr/", qrData); // Use ValidateQRView endpoint
      toast({ title: "Success", description: "Action recorded successfully ✅" });
      qrCodeResult.current = { phone: "", pin: "" }; // Clear QR data
      setCheckForm({ ...checkForm, phone: "", pin: "", location: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to validate QR",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/create/", userForm);
      toast({ title: "Success", description: "User created successfully 🎉" });
      setUserForm({ name: "", phone: "", email: "", role: "manager" });
    } catch (error) {
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

  // Handle QR scan result
  const onQRCodeScan = (decodedText, decodedResult) => {
    try {
      const data = JSON.parse(decodedText); // Assume QR code contains JSON { phone, pin }
      if (data.phone && data.pin) {
        qrCodeResult.current = data;
        setCheckForm((prev) => ({ ...prev, phone: data.phone, pin: data.pin }));
        toast({ title: "Scan Success", description: "QR code scanned successfully!" });
      } else {
        toast({
          title: "Error",
          description: "Invalid QR code format",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to decode QR code",
        variant: "destructive",
      });
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
                PIN Check In/Out
              </Button>
              <Button
                variant={activeTab === "qr" ? "default" : "ghost"}
                onClick={() => setActiveTab("qr")}
                className={`${activeTab === "qr" ? "bg-primary text-primary-foreground" : ""} px-8 py-3 rounded-lg font-medium`}
              >
                <LogIn className="w-4 h-4 mr-2" />
                QR Check In/Out
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
                <CardTitle className="text-2xl font-bold">PIN Check In / Out</CardTitle>
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
          ) : activeTab === "qr" ? (
            <Card className="card-enhanced interactive-hover">
              <CardHeader className="pb-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary">
                  <LogOut className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl font-bold">QR Check In / Out</CardTitle>
                <CardDescription>Scan QR code to record movement</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleQRSubmit} className="space-y-6">
                  <Html5QrcodePlugin
                    fps={10}
                    qrbox={250}
                    disableFlip={false}
                    qrCodeSuccessCallback={onQRCodeScan}
                  />
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
                  <Button type="submit" className="w-full h-12 text-base font-medium transition-all bg-primary hover:opacity-90" disabled={loading || !qrCodeResult.current.phone || !qrCodeResult.current.pin}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                    {loading ? "Processing..." : "Submit QR"}
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
                    <Input id="name" name="name" value={userForm.name} onChange={handleUserChange} required className="h-12 focus-enhanced" />
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
```

#### Step 3: Create `Html5QrcodePlugin` Component
Create a separate file (e.g., `Html5QrcodePlugin.js`) for the QR scanner:

```jsx
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

const Html5QrcodePlugin = ({ fps, qrbox, disableFlip, qrCodeSuccessCallback }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps, qrbox, disableFlip }, false);
    scanner.render(qrCodeSuccessCallback, (error) => {
      console.warn(error);
    });

    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [fps, qrbox, disableFlip, qrCodeSuccessCallback]);

  return <div id="reader" style={{ width: "100%" }} />;
};

export default Html5QrcodePlugin;
```

#### Step 4: Update Backend (`views.py`)
Ensure your `ValidateQRView` in `views.py` is correctly set up to handle QR data. The existing implementation looks good, but let’s confirm it:

```python
class ValidateQRView(APIView):
    def post(self, request):
        try:
            phone = request.data.get('phone')
            pin = request.data.get('pin')
            action = request.data.get('action', 'check_in')
            location = request.data.get('location')

            user = User.objects.get(phone=phone, pin=pin, organization=request.user.organization if request.user.is_authenticated else None)
            if user.role not in ['staff', 'visitor']:
                logger.warning(f"Invalid role attempt for QR access by phone {phone}")
                return Response({
                    "message": "Invalid role for QR access",
                    "success": False
                }, status=status.HTTP_403_FORBIDDEN)

            if action == 'check_out':
                latest_log = AccessLog.objects.filter(user=user, action='check_in').order_by('-timestamp').first()
                if latest_log and not AccessLog.objects.filter(user=user, action='check_out').exists():
                    AccessLog.objects.create(
                        user=user,
                        action='check_out',
                        timestamp=timezone.now(),
                        location=location
                    )
                    return Response({
                        "message": "Check-out successful",
                        "success": True
                    }, status=status.HTTP_200_OK)
                logger.info(f"Check-out failed for {phone}: No active check-in")
                return Response({
                    "message": "No active check-in",
                    "success": False
                }, status=status.HTTP_400_BAD_REQUEST)
            else:  # check_in
                if not AccessLog.objects.filter(user=user, action='check_in').exists():
                    AccessLog.objects.create(
                        user=user,
                        action='check_in',
                        timestamp=timezone.now(),
                        location=location
                    )
                    return Response({
                        "message": "Check-in successful",
                        "success": True
                    }, status=status.HTTP_200_OK)
                logger.info(f"Check-in failed for {phone}: Already checked in")
                return Response({
                    "message": "Already checked in",
                    "success": False
                }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            AccessLog.objects.create(
                action=action,
                status='fail',
                method='qr',
                timestamp=timezone.now(),
                location=location
            )
            logger.error(f"Invalid QR credentials for phone {phone}")
            return Response({
                "message": "Invalid QR credentials",
                "success": False
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Unexpected error in ValidateQRView: {str(e)}")
            return Response({
                "message": "Internal server error",
                "success": False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### Assumptions and Notes
- **QR Code Format**: Assumes the QR code contains a JSON string like `{"phone": "1234567890", "pin": "1234"}`. Adjust `onQRCodeScan` if your QR format differs (e.g., plain text or custom encoding).
- **Permissions**: The `ValidateQRView` uses `request.user.organization` if authenticated, which works for kiosk scenarios where an admin is logged in. For unauthenticated QR scans (e.g., public kiosks), ensure the backend logic supports this (e.g., by checking organization via a separate field or config).
- **UI**: The QR scanner uses a fixed `qrbox` size (250px). Adjust this based on your kiosk’s screen size.
- **Testing**: Test with a QR code generator (e.g., online tools) to create codes with sample `phone` and `pin` data.

### Next Steps
1. Install `html5-qrcode` and create the `Html5QrcodePlugin` component.
2. Update your `CheckInOut` component with the code above.
3. Verify the `/validate-qr/` endpoint in your Django app matches the provided `ValidateQRView`.
4. Test the QR scanning and submission process on a kiosk or tablet.
5. Let me know if you need help with QR code generation for users or further UI tweaks!

Ready to implement this?