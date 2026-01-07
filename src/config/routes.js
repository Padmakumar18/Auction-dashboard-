/**
 * Route Configuration
 * Defines which routes require authentication and which are public
 *
 * Usage:
 * - Add public routes to routeConfig.public array
 * - Add protected routes to routeConfig.protected array
 * - Add standalone routes (no layout) to routeConfig.standalone array
 * - Add conditional routes to routeConfig.conditional array (show layout if logged in)
 */

export const routeConfig = {
  // Public routes - accessible without authentication
  public: [
    "/login",
    "/register",
    "/player-registration-public",
    "/teams",
    "/players",
  ],

  // Protected routes - require authentication
  protected: ["/", "/auction", "/analytics", "/admin"],

  // Standalone routes - no layout (header, sidebar, footer)
  standalone: ["/login", "/register", "/player-registration-public"],

  // Conditional routes - show layout if logged in, no layout if not logged in
  // These routes are accessible to both authenticated and non-authenticated users
  conditional: [
    "/player-registration",
    "/player-registration-enhanced",
    "/teams",
    "/players",
  ],
};

/**
 * Check if a route is public
 */
export const isPublicRoute = (pathname) => {
  return routeConfig.public.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
};

/**
 * Check if a route is protected
 */
export const isProtectedRoute = (pathname) => {
  return routeConfig.protected.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
};

/**
 * Check if a route should be rendered standalone (without layout)
 */
export const isStandaloneRoute = (pathname) => {
  return routeConfig.standalone.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
};

/**
 * Check if a route is conditional (layout depends on auth status)
 */
export const isConditionalRoute = (pathname) => {
  return routeConfig.conditional.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
};

export default routeConfig;
