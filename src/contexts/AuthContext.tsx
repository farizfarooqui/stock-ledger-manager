import React, { createContext, useContext, useState, useCallback } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateCredentials: (newEmail: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getCredentials = () => {
  const stored = localStorage.getItem("admin_credentials");
  if (stored) return JSON.parse(stored);
  return { email: "admin", password: "admin" };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("auth_session"));
  const [user, setUser] = useState<{ email: string } | null>(() => {
    const session = localStorage.getItem("auth_session");
    return session ? JSON.parse(session) : null;
  });

  const login = useCallback((email: string, password: string) => {
    const creds = getCredentials();
    if (email === creds.email && password === creds.password) {
      const userData = { email };
      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem("auth_session", JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("auth_session");
  }, []);

  const updateCredentials = useCallback((newEmail: string, newPassword: string) => {
    localStorage.setItem("admin_credentials", JSON.stringify({ email: newEmail, password: newPassword }));
    const userData = { email: newEmail };
    setUser(userData);
    localStorage.setItem("auth_session", JSON.stringify(userData));
    return true;
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
