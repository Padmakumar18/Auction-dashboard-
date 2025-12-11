import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import Auction from "./pages/Auction";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
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

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authAPI.getCurrentUser();
        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      }
    };
    initAuth();
  }, [setUser]);

  // Enable realtime updates when authenticated
  useRealtime();

  return (
    <Router>
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
