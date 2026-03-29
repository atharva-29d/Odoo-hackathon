function StatCard({ icon: Icon, title, value, note, tone = "brand" }) {
  const tones = {
    brand: "from-brand-400 to-brand-600",
    success: "from-accent-400 to-accent-600",
    warning: "from-amber-400 to-orange-500",
    slate: "from-slate-500 to-slate-700"
  };

  return (
    <div className="card-shell relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${tones[tone] || tones.brand}`} />
      <div className="absolute right-3 top-3 h-24 w-24 rounded-full bg-brand-50 blur-3xl dark:bg-brand-500/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</h3>
          {note ? <p className="mt-2 max-w-[16rem] text-sm text-slate-500 dark:text-slate-300">{note}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 text-brand-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-brand-200">
            <Icon size={22} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StatCard;
