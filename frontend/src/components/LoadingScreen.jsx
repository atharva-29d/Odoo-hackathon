function LoadingScreen({ fullScreen = false, label = "Loading" }) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[240px]"}`}
    >
      <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-soft">
        <span className="h-3 w-3 animate-pulse rounded-full bg-brand-500" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
    </div>
  );
}

export default LoadingScreen;
