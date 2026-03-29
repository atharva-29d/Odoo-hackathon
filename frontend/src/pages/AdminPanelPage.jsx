import {
  Clock3,
  Plus,
  Save,
  Settings2,
  Shield,
  Trash2,
  UserPlus2
} from "lucide-react";
import { useEffect, useState } from "react";

import { api, extractErrorMessage, extractFieldErrors } from "../api/client";
import AlertBanner from "../components/AlertBanner";
import DownloadReportButton from "../components/DownloadReportButton";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { approvalRoleOptions, approvalRuleOptions, defaultWorkflowSteps } from "../utils/constants";
import { formatDate, sentenceCase } from "../utils/formatters";

const emptyUserForm = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  managerId: "",
  department: "",
  title: "",
  approvalRoles: []
};

const buildSettingsForm = (company) => ({
  approvalRule: company?.approvalRule || "hybrid",
  approvalThreshold: company?.approvalThreshold ?? 0.6,
  autoApproveAmount: company?.autoApproveAmount ?? 1000,
  highAmountThreshold: company?.highAmountThreshold ?? 5000,
  highAmountRequiredApprovals: company?.highAmountRequiredApprovals ?? 3,
  workflowSteps: company?.workflowSteps?.length
    ? company.workflowSteps.map((step) => ({
        levelKey: step.levelKey,
        label: step.label,
        approverRole: step.approverRole
      }))
    : defaultWorkflowSteps
});

function AdminPanelPage() {
  const { company, session, setSession } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [settingsForm, setSettingsForm] = useState(buildSettingsForm(company));
  const [userErrors, setUserErrors] = useState({});
  const [settingsErrors, setSettingsErrors] = useState({});
  const [banner, setBanner] = useState({ type: "info", message: "" });
  const [loading, setLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadAdminData = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [usersResponse, settingsResponse, auditResponse] = await Promise.all([
        api.get("/users"),
        api.get("/company/settings"),
        api.get("/company/audit-logs")
      ]);

      setUsers(usersResponse.data.data || []);
      setAuditLogs(auditResponse.data.data || []);
      setSettingsForm(buildSettingsForm(settingsResponse.data.data));
      setBanner({ type: "info", message: "" });
    } catch (error) {
      setBanner({ type: "error", message: extractErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const managerOptions = users.filter((member) => member.role === "manager" || member.role === "admin");

  const handleUserChange = (event) => {
    const { name, value } = event.target;
    setUserForm((current) => ({ ...current, [name]: value }));
    setUserErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSettingsChange = (event) => {
    const { name, value } = event.target;
    setSettingsForm((current) => ({ ...current, [name]: value }));
    setSettingsErrors((current) => ({ ...current, [name]: "" }));
  };

  const toggleApprovalRole = (value) => {
    setUserForm((current) => ({
      ...current,
      approvalRoles: current.approvalRoles.includes(value)
        ? current.approvalRoles.filter((item) => item !== value)
        : [...current.approvalRoles, value]
    }));
  };

  const handleWorkflowChange = (index, field, value) => {
    setSettingsForm((current) => ({
      ...current,
      workflowSteps: current.workflowSteps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const addWorkflowStep = () => {
    setSettingsForm((current) => ({
      ...current,
      workflowSteps: [
        ...current.workflowSteps,
        { levelKey: `step_${current.workflowSteps.length + 1}`, label: "Custom Step", approverRole: "admin" }
      ]
    }));
  };

  const removeWorkflowStep = (index) => {
    setSettingsForm((current) => ({
      ...current,
      workflowSteps: current.workflowSteps.filter((_, stepIndex) => stepIndex !== index)
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setBanner({ type: "info", message: "" });
    setUserErrors({});
    setIsCreatingUser(true);

    try {
      const response = await api.post("/users", userForm);
      setUsers((current) => [response.data.data, ...current]);
      setUserForm(emptyUserForm);
      setBanner({ type: "success", message: "User created successfully." });
      loadAdminData({ silent: true });
    } catch (error) {
      setBanner({ type: "error", message: extractErrorMessage(error) });
      setUserErrors(extractFieldErrors(error));
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setBanner({ type: "info", message: "" });
    setSettingsErrors({});
    setIsSavingSettings(true);

    try {
      const response = await api.put("/company/settings", {
        ...settingsForm,
        approvalThreshold: Number(settingsForm.approvalThreshold),
        autoApproveAmount: Number(settingsForm.autoApproveAmount),
        highAmountThreshold: Number(settingsForm.highAmountThreshold),
        highAmountRequiredApprovals: Number(settingsForm.highAmountRequiredApprovals)
      });

      const updatedCompany = response.data.data;
      setSettingsForm(buildSettingsForm(updatedCompany));
      setSession({
        ...session,
        company: updatedCompany,
        user: {
          ...session.user,
          company: updatedCompany
        }
      });
      setBanner({ type: "success", message: "Company approval settings updated." });
      loadAdminData({ silent: true });
    } catch (error) {
      setBanner({ type: "error", message: extractErrorMessage(error) });
      setSettingsErrors(extractFieldErrors(error));
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading admin workspace" />;
  }

  const adminCount = users.filter((member) => member.role === "admin").length;
  const managerCount = users.filter((member) => member.role === "manager").length;
  const employeeCount = users.filter((member) => member.role === "employee").length;

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Admin panel"
        description="Manage users, tune approval rules, and review the latest audit trail for this company workspace."
        actions={<DownloadReportButton scope="company" label="Download company report" />}
      />

      <AlertBanner type={banner.type} message={banner.message} />

      <div className="mb-6 mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Company" value={company?.name || "Workspace"} />
        <SummaryTile label="Admins" value={adminCount} />
        <SummaryTile label="Managers" value={managerCount} />
        <SummaryTile label="Employees" value={employeeCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
        <div className="space-y-6">
          <form className="card-shell space-y-5" onSubmit={handleCreateUser}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
                <UserPlus2 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Invite a workspace user</h2>
                <p className="text-sm text-slate-500">New users are created in Firebase Authentication and saved in Firestore.</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name" error={userErrors.name}><input name="name" value={userForm.name} onChange={handleUserChange} className="field-input" required /></Field>
              <Field label="Email" error={userErrors.email}><input name="email" type="email" value={userForm.email} onChange={handleUserChange} className="field-input" required /></Field>
              <Field label="Password" error={userErrors.password}><input name="password" type="password" value={userForm.password} onChange={handleUserChange} className="field-input" minLength="6" required /></Field>
              <Field label="Role"><select name="role" value={userForm.role} onChange={handleUserChange} className="field-input"><option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option></select></Field>
              <Field label="Department"><input name="department" value={userForm.department} onChange={handleUserChange} className="field-input" /></Field>
              <Field label="Title"><input name="title" value={userForm.title} onChange={handleUserChange} className="field-input" /></Field>
            </div>

            <Field label="Manager">
              <select name="managerId" value={userForm.managerId} onChange={handleUserChange} className="field-input">
                <option value="">No manager assigned</option>
                {managerOptions.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </Field>

            <div>
              <label className="field-label">Approval roles</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {approvalRoleOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={userForm.approvalRoles.includes(option.value)} onChange={() => toggleApprovalRole(option.value)} />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isCreatingUser} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70">
              {isCreatingUser ? "Creating..." : "Create user"}
            </button>
          </form>

          <form className="card-shell space-y-5" onSubmit={handleSaveSettings}>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-accent-50 p-3 text-accent-700">
                <Settings2 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Approval settings</h2>
                <p className="text-sm text-slate-500">Define workflow steps, percentage thresholds, and amount-based automation.</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Approval rule" error={settingsErrors.approvalRule}>
                <select name="approvalRule" value={settingsForm.approvalRule} onChange={handleSettingsChange} className="field-input">
                  {approvalRuleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Approval threshold" error={settingsErrors.approvalThreshold}><input name="approvalThreshold" type="number" min="0.1" max="1" step="0.1" value={settingsForm.approvalThreshold} onChange={handleSettingsChange} className="field-input" /></Field>
              <Field label="Auto approve below" error={settingsErrors.autoApproveAmount}><input name="autoApproveAmount" type="number" min="0" step="0.01" value={settingsForm.autoApproveAmount} onChange={handleSettingsChange} className="field-input" /></Field>
              <Field label="High amount threshold" error={settingsErrors.highAmountThreshold}><input name="highAmountThreshold" type="number" min="0" step="0.01" value={settingsForm.highAmountThreshold} onChange={handleSettingsChange} className="field-input" /></Field>
              <Field label="Required approvals for high amount" error={settingsErrors.highAmountRequiredApprovals}><input name="highAmountRequiredApprovals" type="number" min="1" step="1" value={settingsForm.highAmountRequiredApprovals} onChange={handleSettingsChange} className="field-input" /></Field>
              <div className="metric-tile">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current currency</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{company?.baseCurrency || "USD"}</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="field-label mb-0">Workflow steps</label>
                <button type="button" onClick={addWorkflowStep} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  <Plus size={16} />
                  Add step
                </button>
              </div>
              <div className="space-y-3">
                {settingsForm.workflowSteps.map((step, index) => (
                  <div key={`${step.levelKey}-${index}`} className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[1fr_1fr_auto]">
                    <input value={step.label} onChange={(event) => handleWorkflowChange(index, "label", event.target.value)} className="field-input bg-white" placeholder="Step label" />
                    <select value={step.approverRole} onChange={(event) => handleWorkflowChange(index, "approverRole", event.target.value)} className="field-input bg-white">
                      {approvalRoleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <button type="button" onClick={() => removeWorkflowStep(index)} disabled={settingsForm.workflowSteps.length === 1} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-500 disabled:opacity-50">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSavingSettings} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70">
              <Save size={16} />
              {isSavingSettings ? "Saving..." : "Save settings"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <section className="card-shell">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-600"><Shield size={18} /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Directory</h2>
                <p className="text-sm text-slate-500">User roles, managers, and special approver assignments.</p>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto scrollbar-thin">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Role</th><th>Manager</th><th>Approval roles</th><th>Created</th></tr></thead>
                <tbody>
                  {users.map((member) => (
                    <tr key={member._id}>
                      <td><p className="font-semibold text-slate-900">{member.name}</p><p className="text-xs text-slate-400">{member.email}</p></td>
                      <td className="capitalize">{member.role}</td>
                      <td>{member.manager?.name || "None"}</td>
                      <td>{member.approvalRoles?.length ? member.approvalRoles.join(", ") : "-"}</td>
                      <td>{formatDate(member.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card-shell">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Clock3 size={18} /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Audit timeline</h2>
                <p className="text-sm text-slate-500">Every major workspace action is logged for visibility.</p>
              </div>
            </div>

            {auditLogs.length === 0 ? (
              <div className="mt-6">
                <EmptyState title="No audit entries yet" description="User, approval, and settings activity will show up here automatically." />
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {auditLogs.map((log) => (
                  <div key={log._id} className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{log.message}</p>
                        <p className="mt-1 text-sm text-slate-500">{log.actor?.name || "System"} • {sentenceCase(log.action)}</p>
                      </div>
                      <span className="mini-label">{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {error ? <p className="mt-2 text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="metric-tile">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

export default AdminPanelPage;
