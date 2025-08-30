// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/http"; // your Axios instance

type Role = "super-admin" | "admin" | "manager" | "staff" | "visitor" | string;

export interface AuthUser {
  phone: string;           // we take this from the login input
  role: Role;              // from /login/ response
  organization?: string;   // from /login/ response
}

interface RegisterOrgPayload {
  organization_name: string;
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface RegisterOrgResponse {
  message: string;
  phone: string;
  pin: string;            // super-admin PIN generated
  redirect_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (phone: string, pin: string) => Promise<void>;                 // <-- phone + pin
  registerOrganization: (data: RegisterOrgPayload) => Promise<RegisterOrgResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const at = localStorage.getItem("access_token");
    const rt = localStorage.getItem("refresh_token");
    const u = localStorage.getItem("auth_user");
    if (at) setAccessToken(at);
    if (rt) setRefreshToken(rt);
    if (u) setUser(JSON.parse(u));
  }, []);

  // Keep Axios Authorization header in sync with the access token
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      localStorage.setItem("access_token", accessToken);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("access_token");
    }
  }, [accessToken]);

  // Persist refresh token + user whenever they change
  useEffect(() => {
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    else localStorage.removeItem("refresh_token");
  }, [refreshToken]);

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  // POST /register/ (organization + super admin). This DOES NOT log the user in.
  const registerOrganization = async (data: RegisterOrgPayload) => {
    const res = await api.post<RegisterOrgResponse>("/register/", data);
    // Backend returns the PIN for the super-admin; do not set tokens here.
    return res.data;
  };

  // POST /login/ with phone + pin, returns access_token + refresh_token + role + organization
  const login = async (phone: string, pin: string) => {
    const res = await api.post<{
      message: string;
      role: Role;
      organization: string;
      access_token: string;
      refresh_token: string;
      redirect_url?: string;
    }>("/login/", { phone, pin });

    setAccessToken(res.data.access_token);
    setRefreshToken(res.data.refresh_token);

    const nextUser: AuthUser = {
      phone, // server response doesn't include phone, so we use the input
      role: res.data.role,
      organization: res.data.organization,
    };
    setUser(nextUser);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    // localStorage + axios header are cleared by effects above
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      login,
      registerOrganization,
      logout,
    }),
    [user, accessToken, refreshToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
