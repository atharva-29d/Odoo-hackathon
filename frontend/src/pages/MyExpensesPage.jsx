import { useEffect, useState } from "react";

import { api, extractErrorMessage } from "../api/client";
import DownloadReportButton from "../components/DownloadReportButton";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../utils/formatters";

function MyExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadExpenses = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await api.get("/expenses/my");
        if (active) {
          setExpenses(response.data.data || []);
          setError("");
        }
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

    loadExpenses();
    const intervalId = setInterval(() => loadExpenses({ silent: true }), 15000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return <LoadingScreen label="Loading your expenses" />;
  }

  const approvedCount = expenses.filter((expense) => expense.status === "approved").length;
  const pendingCount = expenses.filter((expense) => ["pending", "in_review"].includes(expense.status)).length;
  const totalConverted = expenses.reduce((total, expense) => total + Number(expense.convertedAmount || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="My expenses"
        description="Track every submission, its converted company amount, and the full approval trail."
        actions={<DownloadReportButton scope="my" label="Download my report" />}
      />

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoBox label="Total requests" value={expenses.length} />
        <InfoBox label="Approved" value={approvedCount} />
        <InfoBox label="Pending" value={pendingCount} />
        <InfoBox label="Converted total" value={formatCurrency(totalConverted, expenses[0]?.companyCurrency || "USD")} />
      </div>

      {expenses.length === 0 ? (
        <EmptyState title="No expenses submitted yet" description="Once you create a request, the approval status and trail will appear here." />
      ) : (
        <div className="space-y-5">
          {expenses.map((expense) => (
            <div key={expense._id} className="card-shell">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">{expense.category}</h2>
                    <StatusBadge status={expense.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{expense.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="mini-label">{expense.vendorName || "Vendor pending"}</span>
                    <span className="mini-label">{formatDate(expense.expenseDate)}</span>
                    <span className="mini-label capitalize">{expense.companyCurrency || "USD"} company currency</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoBox label="Submitted" value={formatCurrency(expense.submittedAmount, expense.submittedCurrency)} />
                  <InfoBox label="Converted" value={formatCurrency(expense.convertedAmount, expense.companyCurrency)} />
                  <InfoBox label="Date" value={formatDate(expense.expenseDate)} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="metric-tile">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Details</p>
                  <dl className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex justify-between gap-3">
                      <dt>Vendor</dt>
                      <dd className="font-medium text-slate-900">{expense.vendorName || "Not provided"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Exchange rate</dt>
                      <dd className="font-medium text-slate-900">{expense.exchangeRate}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Conversion source</dt>
                      <dd className="font-medium text-slate-900">{expense.conversionSource}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Decision note</dt>
                      <dd className="font-medium text-slate-900">{expense.finalDecisionReason || "Awaiting final decision"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Approval steps</dt>
                      <dd className="font-medium text-slate-900">{expense.approvals?.length || 0}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-[1.5rem] border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Approval trail</p>
                  {expense.approvals?.length ? <TimelineStrip approvals={expense.approvals} /> : null}
                  <div className="mt-4 space-y-3">
                    {expense.approvals?.map((approval) => (
                      <div key={approval._id} className="flex gap-3 rounded-[1.25rem] bg-slate-50 p-4">
                        <div className="flex flex-col items-center">
                          <div className="mt-1 h-3 w-3 rounded-full bg-brand-500" />
                          <div className="h-full w-px bg-slate-200" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">
                                Step {approval.stepOrder}: {approval.levelLabel}
                              </p>
                              <p className="text-sm text-slate-500">{approval.approver?.name || "Unassigned approver"}</p>
                            </div>
                            <StatusBadge status={approval.status} />
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-500">{approval.comment || "No comment yet"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineStrip({ approvals }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <span className="mini-label">Employee</span>
      {approvals.map((approval) => (
        <span key={approval._id} className="mini-label">
          {approval.levelLabel}: {approval.status}
        </span>
      ))}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="metric-tile">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default MyExpensesPage;
