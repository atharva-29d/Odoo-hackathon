function StatCard({ icon: Icon, title, value, note, tone = "brand" }) {
  const tones = {
    brand: "from-brand-500 to-violet-500",
    success: "from-emerald-500 to-teal-500",
    warning: "from-amber-500 to-orange-500",
    slate: "from-slate-700 to-slate-500"
  };

  return (
    <div className="card-shell relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tones[tone] || tones.brand}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
          {note ? <p className="mt-2 text-sm text-slate-500">{note}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
            <Icon size={22} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StatCard;
