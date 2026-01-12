import { useLocation } from "react-router-dom";
import {
  isStandaloneRoute,
  isPublicRoute,
  isConditionalRoute,
} from "../config/routes";
import useStore from "../store/useStore";
import ResponsiveLayout from "./ResponsiveLayout";
import AuthGuard from "./AuthGuard";

/**
 * RouteWrapper component
 * Determines whether to render with layout or standalone
 * Handles authentication based on route configuration
 *
 * Conditional routes: Show layout if logged in, no layout if not logged in
 */
const RouteWrapper = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useStore();
  const standalone = isStandaloneRoute(location.pathname);
  const publicRoute = isPublicRoute(location.pathname);
  const conditional = isConditionalRoute(location.pathname);

  // Conditional routes - layout depends on authentication status
  if (conditional) {
    if (isAuthenticated) {
      // User is logged in - show with layout
      return <ResponsiveLayout>{children}</ResponsiveLayout>;
    } else {
      // User is not logged in - show without layout (standalone)
      return <>{children}</>;
    }
  }

  // Standalone routes (no layout)
  if (standalone) {
    if (publicRoute) {
      // Public standalone route - no auth, no layout
      return <>{children}</>;
    } else {
      // Protected standalone route - auth required, no layout
      return <AuthGuard>{children}</AuthGuard>;
    }
  }

  // Routes with layout
  if (publicRoute) {
    // Public route with layout (rare case)
    return <ResponsiveLayout>{children}</ResponsiveLayout>;
  } else {
    // Protected route with layout (most common)
    return (
      <AuthGuard>
        <ResponsiveLayout>{children}</ResponsiveLayout>
      </AuthGuard>
    );
  }
};

export default RouteWrapper;
