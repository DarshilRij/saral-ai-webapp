import React, { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/**
 * Wrap a protected page with <RequireAuth><Dashboard /></RequireAuth>
 * Redirects to /login and preserves the attempted location in state.
 */
export const RequireAuth: React.FC<{ children: JSX.Element }> = ({
  children,
}) => {
  const { user, ready } = useAuth();
  const location = useLocation();

  // while restoring user from storage we can show nothing (or a spinner)
  if (!ready) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
