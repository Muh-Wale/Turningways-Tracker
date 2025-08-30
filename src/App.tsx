import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Access from "./pages/Access";
import Users from "./pages/Users";
import type { ReactNode } from "react";
import CreateUser from "./pages/CreateUser";
import CheckInOut from "./pages/CheckInOut";
import Index from "./pages/Index";
import TestAuth from "./pages/test";
import { Toaster } from "./components/ui/toaster";

// ✅ Protected Route wrapper
function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/welcome" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create" element={<CreateUser/>} />
          <Route path="/test" element={<TestAuth/>} />
          <Route path="/usercheck" element={<CheckInOut/>} />

          {/* Protected routes */}
          <Route path="/dashboard/*" element={<Dashboard />}/>

          <Route
            path="/access"
            element={
              <PrivateRoute>
                <Access />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster/>
    </AuthProvider>
  );
}
