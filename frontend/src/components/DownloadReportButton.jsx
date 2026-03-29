import { Download } from "lucide-react";
import { useState } from "react";

import { api } from "../api/client";

function DownloadReportButton({ scope = "my", label = "Download report", className = "" }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await api.get(`/expenses/report?scope=${scope}`, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filenameHeader = response.headers["content-disposition"] || "";
      const match = filenameHeader.match(/filename="?([^"]+)"?/i);

      link.href = url;
      link.download = match?.[1] || `expense-report-${scope}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${className}`}
    >
      <Download size={16} />
      {isDownloading ? "Preparing..." : label}
    </button>
  );
}

export default DownloadReportButton;
