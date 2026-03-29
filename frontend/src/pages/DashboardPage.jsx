import {
  ArrowRight,
  ClipboardList,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { api, extractErrorMessage } from "../api/client";
import DownloadReportButton from "../components/DownloadReportButton";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDate } from "../utils/formatters";

function DashboardPage() {
  const { user, company } = useAuth();
  const [state, setState] = useState({
    myExpenses: [],
    teamExpenses: [],
    pendingApprovals: [],
    users: [],
    auditLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const requests = [api.get("/expenses/my")];

        if (["admin", "manager"].includes(user?.role)) {
          requests.push(api.get("/expenses"));
          requests.push(api.get("/expenses/pending"));
        }

        if (user?.role === "admin") {
          requests.push(api.get("/users"));
          requests.push(api.get("/company/audit-logs"));
        }

        const responses = await Promise.all(requests);

        if (!active) {
          return;
        }

        setState({
          myExpenses: responses[0]?.data?.data || [],
          teamExpenses: responses[1]?.data?.data || [],
          pendingApprovals: responses[2]?.data?.data || [],
          users: responses[3]?.data?.data || [],
          auditLogs: responses[4]?.data?.data || []
        });
        setError("");
      } catch (requestError) {
        if (active) {
          setError(extractErrorMessage(requestError));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    const intervalId = setInterval(() => loadDashboard({ silent: true }), 15000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [user?.role]);

  if (loading) {
    return <LoadingScreen label="Loading dashboard" />;
  }

  const visibleExpenses = state.teamExpenses.length ? state.teamExpenses : state.myExpenses;
  const recentExpenses = visibleExpenses.slice(0, 5);
  const queuePreview = state.pendingApprovals.slice(0, 4);
  const totalSpend = visibleExpenses.reduce((total, expense) => total + Number(expense.convertedAmount || 0), 0);
  const pendingCount = visibleExpenses.filter((expense) => ["pending", "in_review"].includes(expense.status)).length;
  const approvedAmount = visibleExpenses
    .filter((expense) => expense.status === "approved")
    .reduce((total, expense) => total + Number(expense.convertedAmount || 0), 0);
  const rejectedCount = visibleExpenses.filter((expense) => expense.status === "rejected").length;

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Expenses, approvals, and company activity in one place."
        actions={
          <>
            <DownloadReportButton scope={["admin", "manager"].includes(user?.role) ? "company" : "my"} label="Export report" />
            <Link
              to="/submit-expense"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              New expense
              <ArrowRight size={16} />
            </Link>
          </>
        }
      />

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ReceiptText} title="Total Expenses" value={visibleExpenses.length} note="Current scope" />
        <StatCard icon={ClipboardList} title="Pending" value={pendingCount} note="Waiting for review" tone="warning" />
        <StatCard icon={ShieldCheck} title="Approved Amount" value={formatCurrency(approvedAmount, company?.baseCurrency)} note="In company currency" tone="success" />
        <StatCard icon={Users2} title="Rejected" value={rejectedCount} note="Closed requests" tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="card-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mini-label">Quick Actions</p>
              <h2 className="mt-3 panel-title">Start from here</h2>
            </div>
            <Sparkles className="text-brand-500" size={18} />
          </div>

          <div className="mt-6 grid gap-3">
            <QuickActionCard
              to="/submit-expense"
              title="Create expense"
              description="Upload a receipt and submit a new request."
              tone="brand"
            />
            {["admin", "manager"].includes(user?.role) ? (
              <QuickActionCard
                to="/approvals"
                title="Open approvals"
                description="Review requests waiting in your queue."
                tone="accent"
              />
            ) : null}
            {user?.role === "admin" ? (
              <QuickActionCard
                to="/admin"
                title="Manage workspace"
                description="Users, rules, and workflow settings."
                tone="slate"
              />
            ) : (
              <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Company spend</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  {formatCurrency(totalSpend, company?.baseCurrency)}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="card-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mini-label">Approval Queue</p>
              <h2 className="mt-3 panel-title">Needs attention</h2>
            </div>
            {["admin", "manager"].includes(user?.role) ? (
              <Link to="/approvals" className="text-sm font-semibold text-brand-600">
                View all
              </Link>
            ) : null}
          </div>

          {queuePreview.length === 0 ? (
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
              No approvals are waiting right now.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {queuePreview.map((approval) => (
                <div key={approval._id} className="rounded-[1.4rem] border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{approval.expense?.employee?.name || "Expense"}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                        {approval.levelLabel} • {approval.expense?.category}
                      </p>
                    </div>
                    <StatusBadge status={approval.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500 dark:text-slate-300">{formatDate(approval.expense?.expenseDate)}</span>
                    <span className="font-semibold text-slate-950 dark:text-slate-50">
                      {formatCurrency(approval.expense?.convertedAmount, approval.expense?.companyCurrency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mini-label">Recent</p>
              <h2 className="mt-3 panel-title">Latest expenses</h2>
            </div>
            <Link to="/my-expenses" className="text-sm font-semibold text-brand-600">
              View all
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No expenses yet" description="Create your first request to start the workflow." />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto scrollbar-thin">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((expense) => (
                    <tr key={expense._id}>
                      <td className="font-medium text-slate-900 dark:text-slate-50">{expense.employee?.name || user?.name}</td>
                      <td>{expense.category}</td>
                      <td>{formatCurrency(expense.convertedAmount, expense.companyCurrency)}</td>
                      <td>{formatDate(expense.expenseDate)}</td>
                      <td>
                        <StatusBadge status={expense.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mini-label">{user?.role === "admin" ? "Audit" : "Summary"}</p>
              <h2 className="mt-3 panel-title">{user?.role === "admin" ? "Latest activity" : "Workspace summary"}</h2>
            </div>
          </div>

          {user?.role === "admin" && state.auditLogs.length ? (
            <div className="mt-6 space-y-3">
              {state.auditLogs.slice(0, 4).map((log) => (
                <div key={log._id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <p className="font-medium text-slate-950 dark:text-slate-50">{log.message}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{log.actor?.name || "System"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SummaryMini label="Users" value={state.users.length || 1} />
              <SummaryMini label="Queue" value={state.pendingApprovals.length} />
              <SummaryMini label="Currency" value={company?.baseCurrency || "USD"} />
              <SummaryMini label="Rule" value={company?.approvalRule || "hybrid"} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function QuickActionCard({ to, title, description, tone = "brand" }) {
  const toneClasses = {
    brand: "from-brand-50 via-white to-brand-50/60",
    accent: "from-accent-50 via-white to-accent-50/70",
    slate: "from-slate-50 via-white to-slate-100"
  };

  return (
    <Link
      to={to}
      className={`rounded-[1.4rem] border border-slate-200/80 bg-gradient-to-r p-4 transition hover:border-brand-200 hover:shadow-soft dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 ${toneClasses[tone] || toneClasses.brand}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950 dark:text-slate-50">{title}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{description}</p>
        </div>
        <ArrowRight className="text-brand-500" size={18} />
      </div>
    </Link>
  );
}

function SummaryMini({ label, value }) {
  return (
    <div className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950 capitalize dark:text-slate-50">{value}</p>
    </div>
  );
}

export default DashboardPage;
