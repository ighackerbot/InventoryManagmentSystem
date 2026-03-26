export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="space-y-2">
      {eyebrow ? (
        <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
          {eyebrow}
        </span>
      ) : null}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-neutral-500">{description}</p> : null}
      </div>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </div>
);
