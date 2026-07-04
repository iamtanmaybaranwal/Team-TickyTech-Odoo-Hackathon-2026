import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function SecurityTab() {
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
    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6 max-w-md">
      <h3 className="text-sm font-semibold text-gray-100 mb-4">Change Password</h3>
      <form onSubmit={handleSubmit}>
        <label className="block text-xs text-gray-500 mb-1">Current Password</label>
        <input
          required
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
        <label className="block text-xs text-gray-500 mb-1">New Password</label>
        <input
          required
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
        <label className="block text-xs text-gray-500 mb-1">Confirm New Password</label>
        <input
          required
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full mb-5 px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
