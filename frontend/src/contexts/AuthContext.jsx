import { createContext, useEffect, useState } from "react";

import { api, extractErrorMessage } from "../api/client";

export const AuthContext = createContext(null);

const storageKey = "rms_session";

const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSession = readStoredSession();
    if (storedSession?.token) {
      localStorage.setItem("rms_token", storedSession.token);
      setSession(storedSession);
    }
    setLoading(false);
  }, []);

  const persistSession = (nextSession) => {
    setSession(nextSession);
    localStorage.setItem(storageKey, JSON.stringify(nextSession));
    localStorage.setItem("rms_token", nextSession.token);
  };

  const clearSession = () => {
    setSession(null);
    localStorage.removeItem(storageKey);
    localStorage.removeItem("rms_token");
  };

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    persistSession(response.data.data);
    return response.data.data;
  };

  const signup = async (payload) => {
    const response = await api.post("/auth/signup", payload);
    persistSession(response.data.data);
    return response.data.data;
  };

  const logout = () => {
    clearSession();
  };

  const value = {
    loading,
    session,
    user: session?.user || null,
    company: session?.company || session?.user?.company || null,
    token: session?.token || null,
    isAuthenticated: Boolean(session?.token),
    login,
    signup,
    logout,
    setSession: persistSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
