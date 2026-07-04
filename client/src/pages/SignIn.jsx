import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate("/", { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { loginId, password });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-100">Human Resource Management System</h1>
          <p className="text-gray-500 mt-1 text-sm">Every workday, perfectly aligned.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-card border border-surface-border rounded-xl p-8 shadow-xl"
        >
          <h2 className="text-lg font-semibold text-gray-100 mb-6">Sign In</h2>

          <label className="block text-sm text-gray-400 mb-1.5">Login ID / Email</label>
          <input
            required
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="e.g. CEJODO20220001 or you@company.com"
            className="w-full mb-4 px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />

          <label className="block text-sm text-gray-400 mb-1.5">Password</label>
          <div className="relative mb-6">
            <input
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-5">
            First time setting up your company?{" "}
            <Link to="/signup" className="text-accent-light hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
