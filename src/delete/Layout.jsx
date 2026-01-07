import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  UserCircle,
  Gavel,
  BarChart3,
  Settings,
  LogOut,
  FilesIcon,
  FileKeyIcon,
} from "lucide-react";
import useStore from "../store/useStore";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useStore();

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

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Cricket Auction</h1>
        </div>

        <nav className="px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
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
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
};

export default Layout;
