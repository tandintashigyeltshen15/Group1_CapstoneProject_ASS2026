"use client";

/* Small pieces shared by the admin pages. Colours and spacing follow ui.jsx. */
import { useEffect } from "react";
import { X } from "lucide-react";

export const nu = (n) => `Nu. ${Number(n || 0).toLocaleString("en-US")}`;

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/* Status -> Badge tone (Badge comes from ui.jsx) */
export const statusTone = {
  Verified: "green", Approved: "green", Active: "green", Open: "green", Published: "green",
  Pending: "orange",
  Rejected: "red", Suspended: "red", Cancelled: "red",
  Closed: "gray", Completed: "gray",
};

const avatarColours = [
  "bg-blue-100 text-primary",
  "bg-purple-100 text-accent",
  "bg-green-100 text-success",
  "bg-orange-100 text-warning",
];

export function Avatar({ name, size = "h-10 w-10", className = "" }) {
  const colour = avatarColours[(name?.length || 0) % avatarColours.length];
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full text-sm font-semibold ${colour} ${className}`}>
      {initials(name) || "?"}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, width = "max-w-lg" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`flex max-h-[90vh] w-full ${width} flex-col rounded-xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-sidebar">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* Pill tabs with a count, like "All Contributions (48)" */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(({ key, label, count, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-sidebar hover:bg-gray-50"
            }`}
          >
            {Icon && <Icon size={16} />}
            {label}
            {count !== undefined && <span>({count})</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search..." }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
    />
  );
}

/* Table wrapper so wide tables scroll instead of breaking the layout */
export function Table({ head, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs font-medium text-muted">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export const btnSm =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-blue-50";
export const btnSmDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-danger px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-red-50";
export const btnSmSuccess =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-success px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-green-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
export const btnSuccess =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
