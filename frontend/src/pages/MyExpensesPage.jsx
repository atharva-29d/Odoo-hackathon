import { useEffect, useState } from "react";

import { api, extractErrorMessage } from "../api/client";
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

  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="My expenses"
        description="Track every submission, its converted company amount, and the full approval trail."
      />

      {error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

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
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoBox label="Submitted" value={formatCurrency(expense.submittedAmount, expense.submittedCurrency)} />
                  <InfoBox label="Converted" value={formatCurrency(expense.convertedAmount, expense.companyCurrency)} />
                  <InfoBox label="Date" value={formatDate(expense.expenseDate)} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl bg-slate-50 p-4">
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
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Approval trail</p>
                  <div className="mt-4 space-y-3">
                    {expense.approvals?.map((approval) => (
                      <div key={approval._id} className="flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            Step {approval.stepOrder}: {approval.levelLabel}
                          </p>
                          <p className="text-sm text-slate-500">{approval.approver?.name || "Unassigned approver"}</p>
                        </div>
                        <div className="md:text-right">
                          <StatusBadge status={approval.status} />
                          <p className="mt-2 text-xs text-slate-500">{approval.comment || "No comment yet"}</p>
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

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default MyExpensesPage;
