import { ChevronDown, CircleUser } from "lucide-react";

export default function Topbar({ role = "Student" }) {
  return (
    <header className="flex h-14 items-center justify-end border-b border-gray-200 bg-white px-8">
      <div className="flex items-center gap-2 text-sm text-text">
        <CircleUser size={26} className="text-primary" />
        <span className="font-medium">{role}</span>
        <ChevronDown size={16} className="text-muted" />
      </div>
    </header>
  );
}