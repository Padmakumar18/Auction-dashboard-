import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, User } from "lucide-react";
import Button from "../components/Button";
import Input from "../components/Input";
import useStore from "../store/useStore";
import { authAPI } from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useStore();

  useEffect(() => {
    const savedEmail = localStorage.getItem("saved_email");
    const savedPassword = localStorage.getItem("saved_password");

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // setPassword(hashMyPassword(password));
    // console.log("password");
    // console.log(hashMyPassword(password));

    try {
      const data = await authAPI.login(email, password);
      setUser(data.user);

      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem("saved_email", email);
        localStorage.setItem("saved_password", password);
      } else {
        // Remove saved credentials if remember me is unchecked
        localStorage.removeItem("saved_email");
        localStorage.removeItem("saved_password");
      }

      toast.success(`Welcome back, ${data.user.full_name || data.user.email}!`);
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Lock size={32} className="text-blue-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Cricket Auction
        </h1>
        <p className="text-center text-gray-600 mb-8">Admin Login</p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          {/* Remember Me Checkbox */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-sm font-medium text-gray-700 cursor-pointer"
            >
              Remember me
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">
              Demo Credentials:
            </p>
          </div>
          <div className="text-xs text-blue-800 space-y-1">
            <p>
              <span className="font-semibold">Email:</span>{" "}
              padmakumarc187@gmail.com
            </p>
            <p>
              <span className="font-semibold">Password:</span> Admin@123
            </p>
          </div>
        </div> */}

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Secure admin access only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
