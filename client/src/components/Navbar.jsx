import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const statusColors = {
  present: "bg-green-500",
  "half-day": "bg-green-500",
  leave: "bg-gray-400",
  absent: "bg-yellow-400",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const dropdownRef = useRef(null);

  const loadStatus = async () => {
    try {
      const { data } = await api.get("/attendance/status");
      setStatus(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleAttendanceClick = async () => {
    setBusy(true);
    try {
      if (!status?.checkedIn) {
        await api.post("/attendance/check-in");
        toast.success("Checked in successfully");
      } else if (!status?.checkedOut) {
        await api.post("/attendance/check-out");
        toast.success("Checked out successfully");
      }
      await loadStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const navLinkClass = (path) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      location.pathname === path || (path !== "/" && location.pathname.startsWith(path))
        ? "bg-accent/20 text-accent-light"
        : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
    }`;

  const dotClass = status ? statusColors[status.status] || "bg-yellow-400" : "bg-gray-600";

  let attendanceLabel = "Check In";
  if (status?.checkedIn && !status?.checkedOut) attendanceLabel = "Check Out";
  if (status?.checkedIn && status?.checkedOut) attendanceLabel = "Checked Out";

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {user?.company?.logoUrl ? (
            <img
              src={user.company.logoUrl}
              alt="logo"
              className="w-9 h-9 rounded-lg object-cover border border-surface-border"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center text-accent-light font-bold">
              {user?.company?.name?.[0] || "H"}
            </div>
          )}
          <span className="font-semibold text-gray-100 truncate hidden sm:block">
            {user?.company?.name || "HRMS"}
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <Link to="/" className={navLinkClass("/")}>
            Employees
          </Link>
          <Link to="/attendance" className={navLinkClass("/attendance")}>
            Attendance
          </Link>
          <Link to="/timeoff" className={navLinkClass("/timeoff")}>
            Time Off
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAttendanceClick}
            disabled={busy || status?.checkedOut}
            title={attendanceLabel}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-card border border-surface-border text-sm text-gray-200 hover:border-accent/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className={`status-dot ${dotClass}`} />
            {attendanceLabel}
          </button>
          <span className={`status-dot ${dotClass} md:hidden`} title={status?.status} />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="w-9 h-9 rounded-full overflow-hidden border border-surface-border bg-surface-card flex items-center justify-center text-sm font-semibold text-gray-200 hover:border-accent/60 transition-colors"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.firstName?.[0] || "U").toUpperCase()
              )}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-surface-border bg-surface-card shadow-xl overflow-hidden">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5"
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/signin");
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 border-t border-surface-border"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
