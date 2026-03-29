import { CheckCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { api, extractErrorMessage } from "../api/client";
import EmptyState from "../components/EmptyState";
import LoadingScreen from "../components/LoadingScreen";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDate } from "../utils/formatters";

function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: "info", message: "" });
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;

    const loadApprovals = async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await api.get("/approvals/pending");
        if (active) {
          setApprovals(response.data.data || []);
          setBanner({ type: "info", message: "" });
        }
      } catch (error) {
        if (active) {
          setBanner({ type: "error", message: extractErrorMessage(error) });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadApprovals();
    const intervalId = setInterval(() => loadApprovals({ silent: true }), 15000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleAction = async (approvalId, action) => {
    setBusyId(approvalId);

    try {
      await api.post(`/approvals/${approvalId}/${action}`, {
        comment: comments[approvalId] || ""
      });

      setApprovals((current) => current.filter((approval) => approval._id !== approvalId));
      setComments((current) => ({ ...current, [approvalId]: "" }));
      setBanner({
        type: "success",
        message: action === "approve" ? "Expense moved to the next stage." : "Expense was rejected and closed."
      });
    } catch (error) {
      setBanner({ type: "error", message: extractErrorMessage(error) });
    } finally {
      setBusyId("");
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading approvals" />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Workflow"
        title="Approval dashboard"
        description={
          user?.role === "admin"
            ? "Review the full live approval queue or override current steps when needed."
            : "Approve or reject the requests currently assigned to you."
        }
      />

      {banner.message ? (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            banner.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : banner.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-sky-200 bg-sky-50 text-sky-700"
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      {approvals.length === 0 ? (
        <EmptyState title="No approvals pending" description="Once a claim reaches your queue, it will appear here automatically." />
      ) : (
        <div className="space-y-5">
          {approvals.map((approval) => (
            <div key={approval._id} className="card-shell">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">{approval.expense?.employee?.name}</h2>
                    <StatusBadge status={approval.status} />
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                      {approval.levelLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{approval.expense?.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoChip label="Requested" value={formatCurrency(approval.expense?.submittedAmount, approval.expense?.submittedCurrency)} />
                  <InfoChip label="Company amount" value={formatCurrency(approval.expense?.convertedAmount, approval.expense?.companyCurrency)} />
                  <InfoChip label="Date" value={formatDate(approval.expense?.expenseDate)} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <label className="field-label" htmlFor={`comment-${approval._id}`}>
                  Comment
                </label>
                <textarea
                  id={`comment-${approval._id}`}
                  rows="3"
                  value={comments[approval._id] || ""}
                  onChange={(event) =>
                    setComments((current) => ({
                      ...current,
                      [approval._id]: event.target.value
                    }))
                  }
                  className="field-input"
                  placeholder="Add context for your decision"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleAction(approval._id, "approve")}
                    disabled={busyId === approval._id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <CheckCheck size={16} />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(approval._id, "reject")}
                    disabled={busyId === approval._id}
                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default ApprovalsPage;
