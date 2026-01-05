import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import AuthGuard from "./components/AuthGuard";
import RedirectHandler from "./components/RedirectHandler";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import PlayerRegistration from "./pages/PlayerRegistration";
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
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout>
                <Dashboard />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/teams"
          element={
            <AuthGuard>
              <Layout>
                <Teams />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/players"
          element={
            <AuthGuard>
              <Layout>
                <Players />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/auction"
          element={
            <AuthGuard>
              <Layout>
                <Auction />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/analytics"
          element={
            <AuthGuard>
              <Layout>
                <Analytics />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <Layout>
                <Admin />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/player-registration"
          element={
            <AuthGuard>
              <Layout>
                <PlayerRegistration />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/player-registration-enhanced"
          element={
            <AuthGuard>
              <Layout>
                <PlayerRegistrationEnhanced />
              </Layout>
            </AuthGuard>
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
