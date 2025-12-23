import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../../types";

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore user from localStorage (optional)
    try {
      const raw = localStorage.getItem("saral_user");
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load user from storage", e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem("saral_user", JSON.stringify(user));
      else localStorage.removeItem("saral_user");
    } catch (e) {
      console.warn("Failed to persist user", e);
    }
  }, [user]);

  const login = (u: User) => setUser(u);
  const logout = () => {
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
