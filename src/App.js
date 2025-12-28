import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import Auction from "./pages/Auction";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import Loader from "./components/Loader";
import useStore from "./store/useStore";
import { authAPI } from "./services/api";
import { useRealtime } from "./hooks/useRealtime";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { setUser, isAuthenticated } = useStore();
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authAPI.getCurrentUser();
        // console.log("user");
        // console.log(user);
        // const data = await authAPI.login(email, password);
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
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <Layout>
                <Teams />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/players"
          element={
            <ProtectedRoute>
              <Layout>
                <Players />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/auction"
          element={
            <ProtectedRoute>
              <Layout>
                <Auction />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Layout>
                <Admin />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
