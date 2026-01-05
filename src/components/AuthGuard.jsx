import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useStore from "../store/useStore";
import sessionManager from "../utils/sessionManager";
import Loader from "./Loader";

/**
 * AuthGuard component that protects routes from unauthorized access
 * Validates authentication state and session validity
 * Redirects to login if needed
 */
const AuthGuard = ({ children }) => {
  const { isAuthenticated, user, logout } = useStore();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Validate session
    const validateSession = () => {
      // Check if session is valid
      if (!sessionManager.isSessionValid()) {
        // Session expired, clear everything
        sessionManager.clearSession();
        logout();
        setIsValidating(false);
        return;
      }

      // Check if user session exists in localStorage
      const storedUser = localStorage.getItem("admin_user");

      if (!storedUser && !user) {
        setIsValidating(false);
        return;
      }

      // Additional validation: check if user object is valid
      if (user && user.id && user.email) {
        // Refresh session on valid access
        sessionManager.refreshSession();
        setIsValidating(false);
        return;
      }

      setIsValidating(false);
    };

    validateSession();
  }, [user, logout]);

  // Show loader while validating
  if (isValidating) {
    return <Loader fullScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return children;
};

export default AuthGuard;
