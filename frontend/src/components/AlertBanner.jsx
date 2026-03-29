function AlertBanner({ type = "info", message }) {
  if (!message) {
    return null;
  }

  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-rose-200 bg-rose-50 text-rose-700"
  };

  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${styles[type] || styles.info}`}>{message}</div>;
}

export default AlertBanner;
