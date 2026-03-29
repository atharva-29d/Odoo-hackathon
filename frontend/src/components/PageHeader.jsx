function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mini-label">{eyebrow}</p> : null}
        <h1 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[2.25rem]">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2 rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export default PageHeader;
