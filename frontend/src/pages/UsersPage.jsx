import { UserPlus2 } from "lucide-react";
import { useEffect, useState } from "react";

import { api, extractErrorMessage, extractFieldErrors } from "../api/client";
import AlertBanner from "../components/AlertBanner";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { approvalRoleOptions } from "../utils/constants";
import { formatDate } from "../utils/formatters";

function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    managerId: "",
    department: "",
    title: "",
    approvalRoles: []
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner] = useState({ type: "info", message: "" });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await api.get("/users");
      setUsers(response.data.data || []);
      setBanner({ type: "info", message: "" });
    } catch (error) {
      setBanner({ type: "error", message: extractErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const managerOptions = users.filter((member) => member.role === "manager" || member.role === "admin");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const toggleApprovalRole = (value) => {
    setForm((current) => ({
      ...current,
      approvalRoles: current.approvalRoles.includes(value)
        ? current.approvalRoles.filter((item) => item !== value)
        : [...current.approvalRoles, value]
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBanner({ type: "info", message: "" });
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await api.post("/users", form);
      setUsers((current) => [response.data.data, ...current]);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "employee",
        managerId: "",
        department: "",
        title: "",
        approvalRoles: []
      });
      setBanner({ type: "success", message: "User created successfully." });
    } catch (error) {
      setBanner({ type: "error", message: extractErrorMessage(error) });
      setFieldErrors(extractFieldErrors(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading users" />;
  }

  const adminCount = users.filter((member) => member.role === "admin").length;
  const managerCount = users.filter((member) => member.role === "manager").length;
  const employeeCount = users.filter((member) => member.role === "employee").length;

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Users and roles"
        description="Create employees and managers, assign reporting lines, and configure special approver roles."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Total users" value={users.length} />
        <SummaryTile label="Admins" value={adminCount} />
        <SummaryTile label="Managers" value={managerCount} />
        <SummaryTile label="Employees" value={employeeCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        {user?.role === "admin" ? (
          <form className="card-shell space-y-5" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
                <UserPlus2 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add a team member</h2>
                <p className="text-sm text-slate-500">New users are saved directly to Firestore and can log in immediately.</p>
              </div>
            </div>

            <AlertBanner type={banner.type} message={banner.message} />

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="field-label">Full name</label>
                <input name="name" required value={form.name} onChange={handleChange} className="field-input" placeholder="Nisha Kapoor" />
                {fieldErrors.name ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.name}</p> : null}
              </div>
              <div>
                <label className="field-label">Email</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} className="field-input" placeholder="nisha@company.com" />
                {fieldErrors.email ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.email}</p> : null}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="field-label">Password</label>
                <input name="password" type="password" minLength="6" required value={form.password} onChange={handleChange} className="field-input" placeholder="At least 6 characters" />
                {fieldErrors.password ? <p className="mt-2 text-xs font-medium text-rose-600">{fieldErrors.password}</p> : null}
              </div>
              <div>
                <label className="field-label">Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="field-input">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="field-label">Department</label>
                <input name="department" value={form.department} onChange={handleChange} className="field-input" placeholder="Sales" />
              </div>
              <div>
                <label className="field-label">Title</label>
                <input name="title" value={form.title} onChange={handleChange} className="field-input" placeholder="Account Executive" />
              </div>
            </div>

            <div>
              <label className="field-label">Manager</label>
              <select name="managerId" value={form.managerId} onChange={handleChange} className="field-input">
                <option value="">No manager assigned</option>
                {managerOptions.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Approval roles</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {approvalRoleOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-300">
                    <input
                      type="checkbox"
                      checked={form.approvalRoles.includes(option.value)}
                      onChange={() => toggleApprovalRole(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create user"}
            </button>
          </form>
          ) : (
          <div className="card-shell">
            <AlertBanner type={banner.type} message={banner.message} />
            <p className="text-sm text-slate-500">Managers can review the live team directory below.</p>
          </div>
        )}

        <section className="card-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Workspace directory</h2>
              <p className="mt-1 text-sm text-slate-500">Current users, roles, and reporting relationships.</p>
            </div>
            <button
              type="button"
              onClick={() => loadUsers({ silent: true })}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Refresh
            </button>
          </div>

          {users.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No users found" description="Create the first employee or manager to start approving expenses." />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto scrollbar-thin">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Manager</th>
                    <th>Approval roles</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </td>
                      <td className="capitalize">{member.role}</td>
                      <td>{member.manager?.name || "None"}</td>
                      <td>{member.approvalRoles?.length ? member.approvalRoles.join(", ") : "-"}</td>
                      <td>{formatDate(member.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="metric-tile">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

export default UsersPage;
