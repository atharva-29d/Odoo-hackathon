import { Inbox } from "lucide-react";

function EmptyState({ title, description }) {
  return (
    <div className="card-shell text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-50 text-brand-600">
        <Inbox size={24} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export default EmptyState;
