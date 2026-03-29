function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const styles = {
    approved: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    in_review: "bg-sky-100 text-sky-700",
    rejected: "bg-rose-100 text-rose-700",
    skipped: "bg-slate-100 text-slate-600"
  };

  return (
    <span className={`status-pill ${styles[normalized] || styles.pending}`}>
      {normalized.replace("_", " ")}
    </span>
  );
}

export default StatusBadge;
