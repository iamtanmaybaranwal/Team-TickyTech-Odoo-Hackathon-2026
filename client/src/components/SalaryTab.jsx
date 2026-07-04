import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Save, X } from "lucide-react";
import api from "../api/axios";
import Spinner from "./Spinner";

const COMPONENT_LABELS = {
  basic: "Basic",
  hra: "HRA (% of Basic)",
  standardAllowance: "Standard Allowance",
  performanceBonus: "Performance Bonus",
  leaveTravelAllowance: "Leave Travel Allowance",
};

export default function SalaryTab({ employeeId }) {
  const [salary, setSalary] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/salary/${employeeId}`);
      setSalary(data.salary);
      setForm(data.salary);
    } catch (err) {
      toast.error("Failed to load salary info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const updateComponent = (key, field) => (e) => {
    const value = field === "value" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: { ...f[key], [field]: value } }));
  };

  const updateTop = (field) => (e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/salary/${employeeId}`, form);
      setSalary(data.salary);
      setForm(data.salary);
      setEditing(false);
      toast.success("Salary info updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update salary");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }
  if (!salary) return null;

  const data = editing ? form : salary;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Wage Type</p>
          <p className="text-sm text-gray-300">Fixed wage, paid monthly / yearly</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200 hover:border-accent/60"
          >
            <Pencil size={14} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-medium disabled:opacity-60"
            >
              <Save size={14} /> {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setForm(salary);
                setEditing(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-sm text-gray-400 hover:text-gray-200"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Monthly Wage (₹)</label>
          {editing ? (
            <input
              type="number"
              value={form.monthlyWage}
              onChange={updateTop("monthlyWage")}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
            />
          ) : (
            <p className="text-sm text-gray-100 font-semibold">₹{data.monthlyWage?.toLocaleString()}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Yearly Wage (₹)</label>
          <p className="text-sm text-gray-100 font-semibold">₹{data.yearlyWage?.toLocaleString()}</p>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Working Days / Week</label>
          {editing ? (
            <input
              type="number"
              value={form.workingDaysPerWeek}
              onChange={updateTop("workingDaysPerWeek")}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
            />
          ) : (
            <p className="text-sm text-gray-100">{data.workingDaysPerWeek} days</p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Salary Components</p>
      <div className="space-y-3 mb-6">
        {Object.entries(COMPONENT_LABELS).map(([key, label]) => (
          <div
            key={key}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center bg-surface rounded-lg p-3 border border-surface-border"
          >
            <p className="text-sm text-gray-300">{label}</p>
            {editing ? (
              <>
                <select
                  value={form[key].type}
                  onChange={updateComponent(key, "type")}
                  className="px-2 py-1.5 rounded bg-surface-card border border-surface-border text-gray-100 text-xs"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <input
                  type="number"
                  value={form[key].value}
                  onChange={updateComponent(key, "value")}
                  className="px-2 py-1.5 rounded bg-surface-card border border-surface-border text-gray-100 text-xs"
                />
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500">
                  {salary[key].type === "fixed" ? "Fixed" : `${salary[key].value}%`}
                </p>
                <p className="text-xs text-gray-500" />
              </>
            )}
            <p className="text-sm text-gray-100 font-medium text-right">
              ₹{(editing ? form[key].amount : salary[key].amount)?.toLocaleString() ?? "—"}/month
            </p>
          </div>
        ))}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center bg-surface rounded-lg p-3 border border-surface-border">
          <p className="text-sm text-gray-300">Fixed Allowance</p>
          <p className="text-xs text-gray-500 col-span-2">Wage − sum of other components</p>
          <p className="text-sm text-gray-100 font-medium text-right">₹{salary.fixedAllowance?.toLocaleString()}/month</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Deductions & Contributions</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-lg p-3 border border-surface-border">
          <p className="text-xs text-gray-500 mb-1">PF Contribution (Employee)</p>
          <p className="text-sm text-gray-100 font-medium">₹{salary.pfEmployee?.toLocaleString()}/month</p>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-surface-border">
          <p className="text-xs text-gray-500 mb-1">PF Contribution (Employer)</p>
          <p className="text-sm text-gray-100 font-medium">₹{salary.pfEmployer?.toLocaleString()}/month</p>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-surface-border">
          <p className="text-xs text-gray-500 mb-1">Professional Tax</p>
          <p className="text-sm text-gray-100 font-medium">₹{salary.professionalTax?.toLocaleString()}/month</p>
        </div>
      </div>
    </div>
  );
}
