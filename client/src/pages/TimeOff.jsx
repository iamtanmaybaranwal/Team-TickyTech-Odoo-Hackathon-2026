import { useEffect, useMemo, useState } from "react";
import { Plus, Check, X as XIcon, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";

const TYPE_LABELS = { paid: "Paid Time Off", sick: "Sick Leave", unpaid: "Unpaid Leave" };
const STATUS_COLORS = {
  pending: "text-yellow-400 bg-yellow-400/10",
  approved: "text-green-400 bg-green-400/10",
  rejected: "text-red-400 bg-red-400/10",
};

export default function TimeOff() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "hr";
  return isAdmin ? <AdminTimeOffView /> : <EmployeeTimeOffView />;
}

function EmployeeTimeOffView() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState({ paid: 24, sick: 7 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [monthRecords, setMonthRecords] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/timeoff/me");
      setRequests(data.requests);
      setBalance(data.balance);
    } catch {
      toast.error("Failed to load time off data");
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      const { data } = await api.get("/attendance/me", { params: attendanceMonth });
      setMonthRecords(data.records);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceMonth]);

  const shiftMonth = (delta) => {
    setAttendanceMonth(({ month, year }) => {
      let m = month + delta;
      let y = year;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      return { month: m, year: y };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-100">Time Off</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Paid Time Off</p>
          <p className="text-2xl font-semibold text-gray-100">
            {balance.paid} <span className="text-sm text-gray-500 font-normal">Days Available</span>
          </p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <p className="text-xs text-gray-500 mb-1">Sick Leave</p>
          <p className="text-2xl font-semibold text-gray-100">
            {balance.sick} <span className="text-sm text-gray-500 font-normal">Days Available</span>
          </p>
        </div>
      </div>

      <MonthCalendar
        month={attendanceMonth.month}
        year={attendanceMonth.year}
        records={monthRecords}
        onShift={shiftMonth}
      />

      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden mt-6">
        <div className="px-4 py-3 border-b border-surface-border">
          <p className="text-sm font-medium text-gray-200">My Requests</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-2.5 font-medium">Start Date</th>
                <th className="px-4 py-2.5 font-medium">End Date</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No time off requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="border-b border-surface-border/60 last:border-0">
                    <td className="px-4 py-2.5 text-gray-300">{r.startDate}</td>
                    <td className="px-4 py-2.5 text-gray-300">{r.endDate}</td>
                    <td className="px-4 py-2.5 text-gray-300">{TYPE_LABELS[r.type]}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{r.comment || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <NewTimeOffModal
        open={showModal}
        onClose={() => setShowModal(false)}
        employeeName={`${user?.firstName || ""} ${user?.lastName || ""}`}
        onCreated={() => {
          setShowModal(false);
          load();
        }}
      />
    </div>
  );
}

function NewTimeOffModal({ open, onClose, employeeName, onCreated }) {
  const [type, setType] = useState("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const allocation = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 0);
  }, [startDate, endDate]);

  const reset = () => {
    setType("paid");
    setStartDate("");
    setEndDate("");
    setRemarks("");
    setAttachment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Please select a validity period");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }
    if (type === "sick" && !attachment) {
      toast.error("Attachment is required for sick leave");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("startDate", startDate);
      fd.append("endDate", endDate);
      fd.append("remarks", remarks);
      if (attachment) fd.append("attachment", attachment);
      await api.post("/timeoff", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Time off request submitted");
      reset();
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Time off Type Request"
    >
      <form onSubmit={handleSubmit}>
        <label className="block text-xs text-gray-500 mb-1">Employee</label>
        <input
          disabled
          value={employeeName}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-400 text-sm"
        />

        <label className="block text-xs text-gray-500 mb-1">Time off Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
        >
          <option value="paid">Paid Time Off</option>
          <option value="sick">Sick Leave</option>
          <option value="unpaid">Unpaid Leave</option>
        </select>

        <label className="block text-xs text-gray-500 mb-1">Validity Period</label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
        </div>

        <label className="block text-xs text-gray-500 mb-1">Allocation</label>
        <input
          disabled
          value={`${allocation} Day${allocation === 1 ? "" : "s"}`}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-400 text-sm"
        />

        <label className="block text-xs text-gray-500 mb-1">Remarks</label>
        <textarea
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
        />

        <label className="block text-xs text-gray-500 mb-1">
          Attachment {type === "sick" && <span className="text-red-400">(required for sick leave)</span>}
        </label>
        <input
          type="file"
          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
          className="w-full mb-5 text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-surface file:text-gray-300 file:text-xs"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white font-medium disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-lg border border-surface-border text-gray-400 hover:text-gray-200"
          >
            Discard
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MonthCalendar({ month, year, records, onShift }) {
  const recordMap = useMemo(() => {
    const m = {};
    records.forEach((r) => (m[r.date] = r.status));
    return m;
  }, [records]);

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay();
  const monthLabel = firstDay.toLocaleDateString([], { month: "long", year: "numeric" });

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const statusDot = (status) => {
    if (status === "present" || status === "half-day") return "bg-green-500";
    if (status === "leave") return "bg-gray-400";
    if (status === "absent") return "bg-yellow-400";
    return "";
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onShift(-1)} className="p-1.5 rounded hover:bg-white/5 text-gray-400">
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium text-gray-200">{monthLabel}</p>
        <button onClick={() => onShift(1)} className="p-1.5 rounded hover:bg-white/5 text-gray-400">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const status = recordMap[dateStr];
          return (
            <div
              key={i}
              className="aspect-square rounded-lg border border-surface-border flex flex-col items-center justify-center gap-1 text-xs text-gray-300"
            >
              <span>{d}</span>
              {status && <span className={`status-dot ${statusDot(status)}`} style={{ width: 6, height: 6 }} />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="status-dot bg-green-500" style={{ width: 8, height: 8 }} /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="status-dot bg-yellow-400" style={{ width: 8, height: 8 }} /> Absent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="status-dot bg-gray-400" style={{ width: 8, height: 8 }} /> Leave
        </span>
      </div>
    </div>
  );
}

function AdminTimeOffView() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/timeoff");
      setRequests(data.requests);
    } catch {
      toast.error("Failed to load time off requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReview = async (id, status) => {
    try {
      await api.put(`/timeoff/${id}/review`, { status, comment: commentDrafts[id] || "" });
      toast.success(`Request ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update request");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      `${r.employee?.firstName} ${r.employee?.lastName} ${r.employee?.loginId}`.toLowerCase().includes(q)
    );
  }, [requests, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-100">Time Off Requests</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee..."
          className="px-3 py-2 w-56 rounded-lg bg-surface-card border border-surface-border text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-surface-border">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Start Date</th>
                <th className="px-4 py-2.5 font-medium">End Date</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No time off requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r._id} className="border-b border-surface-border/60 last:border-0 align-top">
                    <td className="px-4 py-2.5 text-gray-200">
                      {r.employee?.firstName} {r.employee?.lastName}
                      <p className="text-xs text-gray-600">{r.employee?.loginId}</p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-300">{r.startDate}</td>
                    <td className="px-4 py-2.5 text-gray-300">{r.endDate}</td>
                    <td className="px-4 py-2.5 text-gray-300">{TYPE_LABELS[r.type]}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                      {r.attachment && (
                        <a
                          href={r.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-accent-light hover:underline mt-1"
                        >
                          View attachment
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.status === "pending" ? (
                        <div className="flex flex-col gap-1.5 w-40">
                          <input
                            placeholder="Comment (optional)"
                            value={commentDrafts[r._id] || ""}
                            onChange={(e) =>
                              setCommentDrafts((c) => ({ ...c, [r._id]: e.target.value }))
                            }
                            className="px-2 py-1 rounded bg-surface border border-surface-border text-gray-200 text-xs"
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleReview(r._id, "approved")}
                              className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-green-500/15 text-green-400 hover:bg-green-500/25 text-xs font-medium"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleReview(r._id, "rejected")}
                              className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-medium"
                            >
                              <XIcon size={12} /> Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 max-w-[10rem]">{r.comment || "—"}</p>
                      )}
                    </td>
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
