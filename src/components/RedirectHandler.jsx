import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";

/**
 * RedirectHandler component
 * Handles redirects from 404.html for deep links
 */
const RedirectHandler = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useStore();

  useEffect(() => {
    // Check for redirect path from 404.html
    const redirectPath = sessionStorage.getItem("redirectPath");

    if (redirectPath && isAuthenticated) {
      // Clear the redirect path
      sessionStorage.removeItem("redirectPath");

      // Navigate to the intended path
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, isAuthenticated]);

  return null;
};

export default RedirectHandler;
