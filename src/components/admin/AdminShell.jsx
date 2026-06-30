// Shared panel wrapper + small primitives for admin editors.
export const Panel = ({ title, description, children, action }) => {
  return (
    <section className="card p-6 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-forest">{title}</h2>
          {description && <p className="mt-1 text-sm text-forest-700/60">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
};

export const Field = ({ label, children, hint }) => {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-forest-700/50">{hint}</span>}
    </label>
  );
};
