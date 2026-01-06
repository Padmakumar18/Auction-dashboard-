/**
 * Main Application Component
 *
 * ROUTING ARCHITECTURE:
 * - Public Standalone Routes: No auth, no layout (e.g., /login, /register)
 * - Protected Routes with Layout: Auth required, includes sidebar/header (e.g., /teams, /players)
 *
 * RESPONSIVE DESIGN:
 * - Mobile: Hamburger menu navigation
 * - Desktop: Fixed sidebar navigation
 *
 * ACCESS CONTROL:
 * - Route configuration in src/config/routes.js
 * - AuthGuard handles authentication checks
 * - RouteWrapper determines layout rendering
 *
 * PUBLIC PLAYER REGISTRATION:
 * - /register or /player-registration-public
 * - No authentication required
 * - Standalone page (no navigation/header/footer)
 */

import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import RouteWrapper from "./components/RouteWrapper";
import RedirectHandler from "./components/RedirectHandler";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import PlayerRegistration from "./pages/PlayerRegistration";
import PlayerRegistrationPublic from "./pages/PlayerRegistrationPublic";
import PlayerRegistrationEnhanced from "./pages/PlayerRegistrationEnhanced";
import Auction from "./pages/Auction";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import Loader from "./components/Loader";
import useStore from "./store/useStore";
import { authAPI } from "./services/api";
import { useRealtime } from "./hooks/useRealtime";

function App() {
  const { setUser, isAuthenticated } = useStore();
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First, try to get current user from localStorage
        let user = await authAPI.getCurrentUser();

        // If no user in localStorage, try auto-login with saved credentials
        if (!user) {
          const savedEmail = localStorage.getItem("saved_email");
          const savedPassword = localStorage.getItem("saved_password");

          if (savedEmail && savedPassword) {
            try {
              const data = await authAPI.login(savedEmail, savedPassword);
              user = data.user;
            } catch (error) {
              // If auto-login fails, clear saved credentials
              console.error("Auto-login failed:", error);
              localStorage.removeItem("saved_email");
              localStorage.removeItem("saved_password");
            }
          }
        }

        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [setUser]);

  // Enable realtime updates when authenticated
  useRealtime();

  // Show loader while checking authentication
  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <Router>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <RedirectHandler />
      <Routes>
        {/* Public Standalone Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<PlayerRegistrationPublic />} />
        <Route
          path="/player-registration-public"
          element={<PlayerRegistrationPublic />}
        />

        {/* Protected Routes with Layout */}
        <Route
          path="/"
          element={
            <RouteWrapper>
              <Dashboard />
            </RouteWrapper>
          }
        />
        <Route
          path="/teams"
          element={
            <RouteWrapper>
              <Teams />
            </RouteWrapper>
          }
        />
        <Route
          path="/players"
          element={
            <RouteWrapper>
              <Players />
            </RouteWrapper>
          }
        />
        <Route
          path="/auction"
          element={
            <RouteWrapper>
              <Auction />
            </RouteWrapper>
          }
        />
        <Route
          path="/analytics"
          element={
            <RouteWrapper>
              <Analytics />
            </RouteWrapper>
          }
        />
        <Route
          path="/admin"
          element={
            <RouteWrapper>
              <Admin />
            </RouteWrapper>
          }
        />
        <Route
          path="/player-registration"
          element={
            <RouteWrapper>
              <PlayerRegistration />
            </RouteWrapper>
          }
        />
        <Route
          path="/player-registration-enhanced"
          element={
            <RouteWrapper>
              <PlayerRegistrationEnhanced />
            </RouteWrapper>
          }
        />

        {/* Catch all - redirect based on auth status */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
