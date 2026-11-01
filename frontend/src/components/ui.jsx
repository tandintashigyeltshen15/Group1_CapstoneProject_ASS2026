/* Small shared UI pieces so every page looks the same. */
export const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-sidebar transition-colors hover:bg-gray-50";

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold text-sidebar">{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, icon: Icon, action, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sidebar">
            {Icon && <Icon size={20} className="text-primary" />}
            <h2 className="font-semibold">{title}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

const badgeStyles = {
  green: "bg-green-100 text-success",
  orange: "bg-orange-100 text-warning",
  red: "bg-red-100 text-danger",
  blue: "bg-blue-100 text-primary",
  gray: "bg-gray-100 text-muted",
};

export function Badge({ tone = "gray", children }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ message }) {
  return <p className="py-8 text-center text-sm text-muted">{message}</p>;
}

export function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-sidebar">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-sidebar">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

export function Notice({ tone = "green", children }) {
  const s = tone === "green" ? "border-green-200 bg-green-50 text-success" : "border-red-200 bg-red-50 text-danger";
  return <div className={`mb-4 rounded-lg border px-4 py-2 text-sm ${s}`}>{children}</div>;
}
