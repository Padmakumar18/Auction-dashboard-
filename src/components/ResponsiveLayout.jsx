import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  UserCircle,
  Gavel,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  FilesIcon,
  FileKeyIcon,
} from "lucide-react";
import useStore from "../store/useStore";

const ResponsiveLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/teams", icon: Users, label: "Teams" },
    { path: "/players", icon: UserCircle, label: "Players" },
    { path: "/auction", icon: Gavel, label: "Auction" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/admin", icon: Settings, label: "Admin" },
    {
      path: "/player-registration",
      icon: FilesIcon,
      label: "Player Registration",
    },
    {
      path: "/player-registration-enhanced",
      icon: FileKeyIcon,
      label: "Player Registration",
    },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-xl font-bold text-blue-600">Cricket Auction</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Desktop Header */}
        <div className="hidden lg:block p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Cricket Auction</h1>
        </div>

        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">Menu</h1>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="px-4 py-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          {user && (
            <div className="mb-3 px-4 py-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600">Logged in as</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.full_name || user.email}
              </p>
              <p className="text-xs text-blue-600 capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default ResponsiveLayout;
