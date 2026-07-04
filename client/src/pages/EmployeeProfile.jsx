import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil, Save, X, Upload } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import SalaryTab from "../components/SalaryTab";
import SecurityTab from "../components/SecurityTab";

const TABS = ["Resume", "Private Info", "Salary Info", "Security"];

export default function EmployeeProfile({ self }) {
  const params = useParams();
  const { user, refreshUser } = useAuth();
  const id = self ? user?._id : params.id;

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Resume");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const isOwnProfile = employee && user && employee._id === user._id;
  const isAdmin = user?.role === "admin" || user?.role === "hr";
  const canEdit = isOwnProfile || isAdmin;

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/employees/${id}`);
      setEmployee(data.employee);
      setForm(data.employee);
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setEditing(false);
    setActiveTab("Resume");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateList = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }));

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      const editableFields = [
        "phone",
        "address",
        "about",
        "whatILove",
        "interests",
        "bankName",
        "bankAccountNo",
        "ifsc",
        "pan",
        "uan",
        "dob",
        "gender",
        "maritalStatus",
        "nationality",
        ...(isAdmin ? ["firstName", "lastName", "email", "designation", "department", "role"] : []),
      ];
      editableFields.forEach((f) => {
        if (form[f] !== undefined && form[f] !== null) fd.append(f, form[f]);
      });
      fd.append("skills", (form.skills || []).join(","));
      fd.append("certifications", (form.certifications || []).join(","));
      if (avatarFile) fd.append("profilePicture", avatarFile);

      const { data } = await api.put(`/employees/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEmployee(data.employee);
      setForm(data.employee);
      setEditing(false);
      setAvatarFile(null);
      toast.success("Profile updated");
      if (isOwnProfile) refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (!employee) return <p className="text-gray-500">Employee not found.</p>;

  return (
    <div>
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label
              className={`relative w-20 h-20 rounded-full overflow-hidden bg-surface border border-surface-border flex items-center justify-center text-2xl font-semibold text-gray-300 shrink-0 ${
                editing ? "cursor-pointer" : ""
              }`}
            >
              {avatarPreview || employee.profilePicture ? (
                <img
                  src={avatarPreview || employee.profilePicture}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                employee.firstName?.[0]?.toUpperCase()
              )}
              {editing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Upload size={18} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
              )}
            </label>
            <div>
              {editing && isAdmin ? (
                <div className="flex gap-2 mb-1">
                  <input
                    value={form.firstName || ""}
                    onChange={update("firstName")}
                    className="px-2 py-1 rounded bg-surface border border-surface-border text-gray-100 text-lg font-semibold w-32"
                  />
                  <input
                    value={form.lastName || ""}
                    onChange={update("lastName")}
                    className="px-2 py-1 rounded bg-surface border border-surface-border text-gray-100 text-lg font-semibold w-32"
                  />
                </div>
              ) : (
                <h2 className="text-lg font-semibold text-gray-100">
                  {employee.firstName} {employee.lastName}
                </h2>
              )}
              <p className="text-sm text-gray-500">
                {employee.designation || "—"} · {employee.department || "—"}
              </p>
              <p className="text-xs text-gray-600">{employee.loginId} · {employee.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-surface-border text-sm text-gray-200 hover:border-accent/60"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white text-sm font-medium disabled:opacity-60"
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm(employee);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-sm text-gray-400 hover:text-gray-200"
                >
                  <X size={14} /> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-surface-border mb-5">
        {TABS.filter((t) => t !== "Salary Info" || isAdmin)
          .filter((t) => t !== "Security" || isOwnProfile)
          .map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-accent text-accent-light"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
      </div>

      {activeTab === "Resume" && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-5">
          <Field
            label="About"
            editing={editing}
            value={form.about}
            onChange={update("about")}
            display={employee.about}
            textarea
          />
          <Field
            label="What I love about my job"
            editing={editing}
            value={form.whatILove}
            onChange={update("whatILove")}
            display={employee.whatILove}
            textarea
          />
          <Field
            label="Interests & Hobbies"
            editing={editing}
            value={form.interests}
            onChange={update("interests")}
            display={employee.interests}
            textarea
          />
          <Field
            label="Skills (comma separated)"
            editing={editing}
            value={(form.skills || []).join(", ")}
            onChange={updateList("skills")}
            display={(employee.skills || []).join(", ")}
          />
          <Field
            label="Certifications (comma separated)"
            editing={editing}
            value={(form.certifications || []).join(", ")}
            onChange={updateList("certifications")}
            display={(employee.certifications || []).join(", ")}
          />
        </div>
      )}

      {activeTab === "Private Info" && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Phone" editing={editing} value={form.phone} onChange={update("phone")} display={employee.phone} />
          <Field label="Address" editing={editing} value={form.address} onChange={update("address")} display={employee.address} />
          <Field
            label="Date of Birth"
            editing={editing}
            type="date"
            value={form.dob ? form.dob.slice(0, 10) : ""}
            onChange={update("dob")}
            display={employee.dob ? new Date(employee.dob).toLocaleDateString() : "—"}
          />
          <SelectField
            label="Gender"
            editing={editing}
            value={form.gender}
            onChange={update("gender")}
            display={employee.gender}
            options={["Male", "Female", "Other"]}
          />
          <SelectField
            label="Marital Status"
            editing={editing}
            value={form.maritalStatus}
            onChange={update("maritalStatus")}
            display={employee.maritalStatus}
            options={["Single", "Married", "Other"]}
          />
          <Field label="Nationality" editing={editing} value={form.nationality} onChange={update("nationality")} display={employee.nationality} />
          <Field
            label="Date of Joining"
            editing={editing && isAdmin}
            type="date"
            value={form.dateOfJoining ? form.dateOfJoining.slice(0, 10) : ""}
            onChange={update("dateOfJoining")}
            display={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : "—"}
          />
          <Field label="Bank Name" editing={editing} value={form.bankName} onChange={update("bankName")} display={employee.bankName} />
          <Field label="Bank Account No." editing={editing} value={form.bankAccountNo} onChange={update("bankAccountNo")} display={employee.bankAccountNo} />
          <Field label="IFSC" editing={editing} value={form.ifsc} onChange={update("ifsc")} display={employee.ifsc} />
          <Field label="PAN" editing={editing} value={form.pan} onChange={update("pan")} display={employee.pan} />
          <Field label="UAN" editing={editing} value={form.uan} onChange={update("uan")} display={employee.uan} />
        </div>
      )}

      {activeTab === "Salary Info" && isAdmin && <SalaryTab employeeId={id} />}

      {activeTab === "Security" && isOwnProfile && <SecurityTab />}
    </div>
  );
}

function Field({ label, editing, value, onChange, display, textarea, type = "text" }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {editing ? (
        textarea ? (
          <textarea
            value={value || ""}
            onChange={onChange}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
        ) : (
          <input
            type={type}
            value={value || ""}
            onChange={onChange}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
          />
        )
      ) : (
        <p className="text-sm text-gray-200 whitespace-pre-wrap">{display || "—"}</p>
      )}
    </div>
  );
}

function SelectField({ label, editing, value, onChange, display, options }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {editing ? (
        <select
          value={value || ""}
          onChange={onChange}
          className="w-full px-3 py-2 rounded-lg bg-surface border border-surface-border text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-accent/60"
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-gray-200">{display || "—"}</p>
      )}
    </div>
  );
}
