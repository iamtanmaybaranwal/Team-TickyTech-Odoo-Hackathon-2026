import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logo) fd.append("logo", logo);

      const { data } = await api.post("/auth/signup", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      login(data.token, data.user);
      toast.success(`Company created! Your Login ID is ${data.user.loginId}`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Human Resource Management System</h1>
          <p className="text-gray-500 mt-1 text-sm">Every workday, perfectly aligned.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-card border border-surface-border rounded-xl p-8 shadow-xl"
        >
          <h2 className="text-lg font-semibold text-gray-100 mb-1">Sign Up</h2>
          <p className="text-xs text-gray-500 mb-6">
            The first person to sign up for a company becomes its Admin.
          </p>

          <div className="flex items-center gap-4 mb-5">
            <label className="w-16 h-16 rounded-lg border border-dashed border-surface-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent/60 shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="logo preview" className="w-full h-full object-cover" />
              ) : (
                <Upload size={18} className="text-gray-500" />
              )}
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1.5">Company Name</label>
              <input
                required
                value={form.companyName}
                onChange={update("companyName")}
                placeholder="Acme Corp"
                className="w-full px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">First Name</label>
              <input
                required
                value={form.firstName}
                onChange={update("firstName")}
                className="w-full px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
              <input
                value={form.lastName}
                onChange={update("lastName")}
                className="w-full px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
              />
            </div>
          </div>

          <label className="block text-sm text-gray-400 mb-1.5">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={update("email")}
            className="w-full mb-4 px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />

          <label className="block text-sm text-gray-400 mb-1.5">Phone</label>
          <input
            value={form.phone}
            onChange={update("phone")}
            className="w-full mb-4 px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  required
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link to="/signin" className="text-accent-light hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
