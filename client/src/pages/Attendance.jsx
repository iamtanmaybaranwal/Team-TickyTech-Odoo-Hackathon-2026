import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

const statusColors = {
  present: "text-green-400",
  "half-day": "text-green-400",
  leave: "text-gray-400",
  absent: "text-yellow-400",
};

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Attendance() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "hr";
  return isAdmin ? <AdminAttendanceView /> : <EmployeeAttendanceView />;
}

function EmployeeAttendanceView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/attendance/me", { params: { month, year } });
      setRecords(data.records);
      setSummary(data.summary);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString([], { month: "long", year: "numeric" });

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-100 mb-6">My Attendance</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Days Present" value={summary.daysPresent ?? "—"} />
        <SummaryCard label="Leave Days" value={summary.leaveCount ?? "—"} />
        <SummaryCard label="Total Working Days" value={summary.totalWorkingDays ?? "—"} />
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded hover:bg-white/5 text-gray-400">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-200">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded hover:bg-white/5 text-gray-400">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Check In</th>
                <th className="px-4 py-2.5 font-medium">Check Out</th>
                <th className="px-4 py-2.5 font-medium">Work Hours</th>
                <th className="px-4 py-2.5 font-medium">Extra Hours</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No attendance records for this month.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r._id} className="border-b border-surface-border/60 last:border-0">
                    <td className="px-4 py-2.5 text-gray-300">{r.date}</td>
                    <td className="px-4 py-2.5 text-gray-300">{fmtTime(r.checkIn)}</td>
                    <td className="px-4 py-2.5 text-gray-300">{fmtTime(r.checkOut)}</td>
                    <td className="px-4 py-2.5 text-gray-300">{r.workHours || 0}h</td>
                    <td className="px-4 py-2.5 text-gray-300">{r.extraHours || 0}h</td>
                    <td className={`px-4 py-2.5 capitalize font-medium ${statusColors[r.status]}`}>{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AdminAttendanceView() {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/attendance", { params: { date } });
      setRows(data.rows);
      setPresentCount(data.presentCount);
      setTotalCount(data.totalCount);
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const shiftDay = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.employee.firstName} ${r.employee.lastName} ${r.employee.loginId}`.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const dayLabel = new Date(date).toLocaleDateString([], {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-100">Attendance</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="font-medium text-gray-200">{presentCount}</span> / {totalCount} present today
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDay(-1)} className="p-1.5 rounded hover:bg-white/5 text-gray-400">
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-2 py-1.5 rounded bg-surface border border-surface-border text-gray-200 text-sm"
            />
            <button onClick={() => shiftDay(1)} className="p-1.5 rounded hover:bg-white/5 text-gray-400">
              <ChevronRight size={18} />
            </button>
            <span className="text-sm text-gray-500 hidden md:block">{dayLabel}</span>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="pl-9 pr-3 py-1.5 w-56 rounded-lg bg-surface border border-surface-border text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-2.5 font-medium">Employee</th>
                <th className="px-4 py-2.5 font-medium">Check In</th>
                <th className="px-4 py-2.5 font-medium">Check Out</th>
                <th className="px-4 py-2.5 font-medium">Work Hours</th>
                <th className="px-4 py-2.5 font-medium">Extra Hours</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.employee._id} className="border-b border-surface-border/60 last:border-0">
                  <td className="px-4 py-2.5 text-gray-200 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-surface border border-surface-border flex items-center justify-center text-xs text-gray-300 overflow-hidden shrink-0">
                      {r.employee.profilePicture ? (
                        <img src={r.employee.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        r.employee.firstName?.[0]
                      )}
                    </div>
                    {r.employee.firstName} {r.employee.lastName}
                  </td>
                  <td className="px-4 py-2.5 text-gray-300">{fmtTime(r.checkIn)}</td>
                  <td className="px-4 py-2.5 text-gray-300">{fmtTime(r.checkOut)}</td>
                  <td className="px-4 py-2.5 text-gray-300">{r.workHours || 0}h</td>
                  <td className="px-4 py-2.5 text-gray-300">{r.extraHours || 0}h</td>
                  <td className={`px-4 py-2.5 capitalize font-medium ${statusColors[r.status]}`}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-100">{value}</p>
    </div>
  );
}
