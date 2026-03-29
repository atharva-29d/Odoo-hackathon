function EmptyState({ title, description }) {
  return (
    <div className="card-shell text-center">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default EmptyState;
