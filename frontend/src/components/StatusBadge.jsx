function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const styles = {
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    in_review: "border-sky-200 bg-sky-50 text-sky-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
    skipped: "border-slate-200 bg-slate-100 text-slate-600"
  };

  return (
    <span className={`status-pill ${styles[normalized] || styles.pending}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {normalized.replace("_", " ")}
    </span>
  );
}

export default StatusBadge;
