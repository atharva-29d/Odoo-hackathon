import { ArrowRight, CheckCircle2, ClipboardList, IndianRupee, ReceiptText, Users2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { api, extractErrorMessage } from "../api/client";
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
    users: []
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
          requests.push(api.get("/approvals/pending"));
          requests.push(api.get("/users"));
        }

        const responses = await Promise.all(requests);

        if (!active) {
          return;
        }

        setState({
          myExpenses: responses[0]?.data?.data || [],
          teamExpenses: responses[1]?.data?.data || [],
          pendingApprovals: responses[2]?.data?.data || [],
          users: responses[3]?.data?.data || []
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
    return <LoadingScreen label="Loading dashboard metrics" />;
  }

  const myApproved = state.myExpenses.filter((expense) => expense.status === "approved").length;
  const myPending = state.myExpenses.filter((expense) => ["pending", "in_review"].includes(expense.status)).length;
  const mySpend = state.myExpenses.reduce((total, expense) => total + Number(expense.convertedAmount || 0), 0);
  const companySpend = state.teamExpenses.reduce((total, expense) => total + Number(expense.convertedAmount || 0), 0);
  const recentExpenses = (state.teamExpenses.length ? state.teamExpenses : state.myExpenses).slice(0, 5);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${user?.name?.split(" ")[0] || "there"}`}
        description="Track reimbursement health, pending actions, and the latest claims from one place."
        actions={
          <>
            <Link
              to="/submit-expense"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Submit expense
              <ArrowRight size={16} />
            </Link>
            {["admin", "manager"].includes(user?.role) ? (
              <Link
                to="/approvals"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                Review approvals
                <ClipboardList size={16} />
              </Link>
            ) : null}
          </>
        }
      />

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ReceiptText} title="My expenses" value={state.myExpenses.length} note="All submitted claims" />
        <StatCard icon={CheckCircle2} title="Approved claims" value={myApproved} note="Ready for reimbursement" tone="success" />
        <StatCard icon={ClipboardList} title="Pending reviews" value={state.pendingApprovals.length} note="Current approval queue" tone="warning" />
        <StatCard
          icon={IndianRupee}
          title={user?.role === "employee" ? "My spend" : "Company spend"}
          value={formatCurrency(user?.role === "employee" ? mySpend : companySpend, company?.baseCurrency)}
          note={`Base currency ${company?.baseCurrency || "USD"}`}
          tone="slate"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card-shell">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent expenses</h2>
              <p className="mt-1 text-sm text-slate-500">
                {user?.role === "employee" ? "Your latest submitted requests" : "Latest team and company claims"}
              </p>
            </div>
            <Link to="/my-expenses" className="text-sm font-semibold text-brand-600">
              View all
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No expenses yet" description="Submit the first reimbursement request to start your workflow." />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto scrollbar-thin">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentExpenses.map((expense) => (
                    <tr key={expense._id}>
                      <td className="py-4 font-medium text-slate-900">{expense.employee?.name || user?.name}</td>
                      <td className="py-4 text-slate-600">{expense.category}</td>
                      <td className="py-4 text-slate-600">
                        {formatCurrency(expense.submittedAmount, expense.submittedCurrency)}{" "}
                        <span className="text-xs text-slate-400">
                          ({formatCurrency(expense.convertedAmount, expense.companyCurrency)})
                        </span>
                      </td>
                      <td className="py-4 text-slate-600">{formatDate(expense.expenseDate)}</td>
                      <td className="py-4">
                        <StatusBadge status={expense.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="card-shell bg-hero text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-100">Quick snapshot</p>
            <h3 className="mt-3 text-2xl font-bold">Approvals refresh automatically every 15 seconds.</h3>
            <p className="mt-3 text-sm text-white/80">
              Your managers and admins always see the newest queue without refreshing the app manually.
            </p>
          </div>

          <div className="card-shell">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Team summary</h2>
                <p className="mt-1 text-sm text-slate-500">People and reimbursement activity across the workspace.</p>
              </div>
              <Users2 className="text-brand-500" size={20} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Pending for me</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{state.pendingApprovals.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Users in workspace</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{state.users.length || 1}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Pending claims</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{myPending}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Approval rule</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{company?.approvalRule || "hybrid"}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
