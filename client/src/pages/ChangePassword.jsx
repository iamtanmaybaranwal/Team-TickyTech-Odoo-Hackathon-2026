import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function ChangePassword({ forced }) {
  const { refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password updated. Please continue.");
      await refreshUser();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-card border border-surface-border rounded-xl p-8 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-100 mb-1">
          {forced ? "Set a New Password" : "Change Password"}
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          {forced
            ? "This is your first login. Please set a new password to continue."
            : "Update your account password."}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-gray-400 mb-1.5">Current / Temporary Password</label>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
          <label className="block text-sm text-gray-400 mb-1.5">New Password</label>
          <input
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
          <label className="block text-sm text-gray-400 mb-1.5">Confirm New Password</label>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mb-6 px-3 py-2.5 rounded-lg bg-surface border border-surface-border text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
          {forced && (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/signin");
              }}
              className="w-full mt-3 py-2.5 rounded-lg border border-surface-border text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel &amp; Log Out
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
