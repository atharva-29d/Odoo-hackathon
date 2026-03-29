import { LoaderCircle } from "lucide-react";

function LoadingScreen({ fullScreen = false, label = "Loading" }) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[240px]"}`}
    >
      <div className="flex items-center gap-3 rounded-full border border-white/80 bg-white/90 px-5 py-3 shadow-soft">
        <LoaderCircle size={16} className="animate-spin text-brand-600" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
    </div>
  );
}

export default LoadingScreen;
