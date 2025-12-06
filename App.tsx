import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  redirect,
  useNavigate,
} from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Auth as AuthComponent } from "./components/Auth";
import { Dashboard } from "./components/Dashboard";
import { User } from "./types";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import { RequireAuth } from "./src/auth/RequireAuth";

/**
 * Small adapter that passes auth.login into your existing Auth component.
 * Your current Auth component calls onComplete(user) — we hook that into context.
 */
const LoginWrapper: React.FC<{ defaultMode?: "SIGN_IN" | "SIGN_UP" }> = ({
  defaultMode = "SIGN_IN",
}) => {
  const { login } = useAuth();

  const handleComplete = (u: User) => {
    login(u);
  };

  return <AuthComponent defaultMode={defaultMode} onComplete={handleComplete} />;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route
          path="/signup"
          element={<LoginWrapper defaultMode="SIGN_UP" />}
        />

        {/* protected */}
        <Route
          path="/dashboard/*"
          element={
            <RequireAuth>
              <DashboardWrapper />
            </RequireAuth>
          }
        />

        {/* convenience redirects */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * Small wrapper to pass logout and user to Dashboard.
 * useAuth holds current user and logout method.
 */
const DashboardWrapper: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null; // Shouldn't happen because RequireAuth guards, but keep TS-safe.

  return <Dashboard user={user} onLogout={logout} />;
};

const App: React.FC = () => (
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);

export default App;
