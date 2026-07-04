import { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import EmployeeCard from "../components/EmployeeCard";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "hr";

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, statusRes] = await Promise.all([
        api.get("/employees"),
        api.get("/attendance/today-status"),
      ]);
      setEmployees(empRes.data.employees);
      setStatuses(statusRes.data.statuses);
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${e.firstName} ${e.lastName} ${e.loginId} ${e.designation} ${e.department} ${e.email}`
        .toLowerCase()
        .includes(q)
    );
  }, [employees, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-100">Employees</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="pl-9 pr-3 py-2 w-64 rounded-lg bg-surface-card border border-surface-border text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/60"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-20">No employees found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp) => (
            <EmployeeCard key={emp._id} employee={emp} status={statuses[emp._id]} />
          ))}
        </div>
      )}

      <AddEmployeeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={() => {
          setShowAddModal(false);
          loadData();
        }}
      />
    </div>
  );
}

function AddEmployeeModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "employee",
    designation: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/employees", form);
      setCreated({ loginId: data.employee.loginId, tempPassword: data.tempPassword });
      toast.success("Employee created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "employee",
      designation: "",
      department: "",
    });
    setCreated(null);
    if (created) onCreated();
    else onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Employee">
      {created ? (
        <div>
          <p className="text-sm text-gray-300 mb-4">
            Employee created! Share these credentials with them — they'll be asked to set a new
            password on first login.
          </p>
          <div className="bg-surface border border-surface-border rounded-lg p-4 mb-4 space-y-1">
            <p className="text-sm text-gray-400">
              Login ID: <span className="text-gray-100 font-mono">{created.loginId}</span>
            </p>
            <p className="text-sm text-gray-400">
              Temp Password: <span className="text-gray-100 font-mono">{created.tempPassword}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">First Name</label>
              <input
                required
                value={form.firstName}
                onChange={update("firstName")}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Last Name</label>
              <input
                value={form.lastName}
                onChange={update("lastName")}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
              />
            </div>
          </div>
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={update("email")}
            className="w-full mb-3 px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={update("phone")}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Role</label>
              <select
                value={form.role}
                onChange={update("role")}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Designation</label>
              <input
                value={form.designation}
                onChange={update("designation")}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Department</label>
              <input
                value={form.department}
                onChange={update("department")}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-white font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Employee"}
          </button>
        </form>
      )}
    </Modal>
  );
}
