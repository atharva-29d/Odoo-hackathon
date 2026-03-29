import { AlertCircle, CheckCircle2, Info } from "lucide-react";

function AlertBanner({ type = "info", message }) {
  if (!message) {
    return null;
  }

  const styles = {
    info: {
      className: "border-sky-200 bg-sky-50/90 text-sky-800",
      Icon: Info
    },
    success: {
      className: "border-emerald-200 bg-emerald-50/90 text-emerald-800",
      Icon: CheckCircle2
    },
    error: {
      className: "border-rose-200 bg-rose-50/90 text-rose-800",
      Icon: AlertCircle
    }
  };

  const { className, Icon } = styles[type] || styles.info;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${className}`}>
      <Icon className="mt-0.5 shrink-0" size={16} />
      <span>{message}</span>
    </div>
  );
}

export default AlertBanner;
