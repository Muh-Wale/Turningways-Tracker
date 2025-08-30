import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { PropsWithChildren } from "react";

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { accessToken } = useAuth();
  return accessToken ? <>{children}</> : <Navigate to="/login" />;
}
