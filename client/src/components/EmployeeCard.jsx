import { useNavigate } from "react-router-dom";

const statusColors = {
  present: "bg-green-500",
  "half-day": "bg-green-500",
  leave: "bg-gray-400",
  absent: "bg-yellow-400",
};

export default function EmployeeCard({ employee, status }) {
  const navigate = useNavigate();
  const dotClass = statusColors[status] || "bg-yellow-400";

  return (
    <button
      onClick={() => navigate(`/employees/${employee._id}`)}
      className="relative text-left bg-surface-card border border-surface-border rounded-xl p-4 hover:border-accent/60 hover:-translate-y-0.5 transition-all"
    >
      <span
        className={`absolute top-3 right-3 status-dot ${dotClass}`}
        title={status || "absent"}
      />
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface border border-surface-border flex items-center justify-center text-gray-300 font-semibold shrink-0">
          {employee.profilePicture ? (
            <img src={employee.profilePicture} alt="" className="w-full h-full object-cover" />
          ) : (
            employee.firstName?.[0]?.toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-100 truncate">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">{employee.designation || employee.role}</p>
          <p className="text-xs text-gray-600 truncate">{employee.loginId}</p>
        </div>
      </div>
    </button>
  );
}
