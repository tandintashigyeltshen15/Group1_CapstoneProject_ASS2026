"use client";

import Link from "next/link";
import Image from "next/image";

// Full class names are written out so Tailwind can detect them.
const SELF_SIGNUP_ROLES = [
  {
    key: "student",
    icon: "🎓",
    title: "Student",
    titleClass: "text-primary",
    description: "Access academic resources, events and campus opportunities.",
    href: "/signup/student",
    cta: "Register as Student",
    buttonClass: "bg-primary text-white",
  },
  {
    key: "alumni",
    icon: "🧑",
    title: "Alumni",
    titleClass: "text-alumni",
    description: "Connect with alumni, explore events and grow your network.",
    href: "/signup/alumni",
    cta: "Register as Alumni",
    buttonClass: "bg-alumni text-white",
  },
  {
    key: "staff",
    icon: "🏛",
    title: "Staff",
    titleClass: "text-accent",
    description: "Manage events, content and support the alumni community.",
    href: "/signup/staff",
    cta: "Register as Staff",
    buttonClass: "bg-accent text-white",
  },
];

const ADMIN_CREATED_ROLES = [
  {
    key: "admin",
    icon: "🏢",
    title: "Administration",
    titleClass: "text-admin",
    description: "Manage system settings, users and portal configurations.",
    href: "/login?role=admin",
    cta: "Administrator Login",
    buttonClass: "border border-admin text-admin hover:bg-admin/10",
  },
];

function RoleCard({ role, adminCreated }) {
  return (
    <div className="bg-white text-text rounded-xl p-6 w-60 flex flex-col items-center text-center">
      <div className="text-4xl mb-3">{role.icon}</div>
      <h3 className={`text-lg font-bold mb-2 ${role.titleClass}`}>{role.title}</h3>
      <p className="text-sm text-muted mb-4">{role.description}</p>

      {adminCreated && (
        <p className="mb-4 rounded-lg bg-gray-100 px-3 py-2 text-xs text-muted">
          Accounts are created by the CST administrator. Please contact them to get access.
        </p>
      )}

      <Link
        href={role.href}
        className={`mt-auto w-full py-2 rounded-lg text-sm font-medium ${role.buttonClass}`}
      >
        {role.cta}
      </Link>
    </div>
  );
}

export default function RoleSelectionPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-white">
      {/* Campus image with a subtle purple tint */}
      <Image
        src="/campus.jpg"
        alt="CST Campus"
        fill
        priority
        className="z-0 object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-accent/15" />

      {/* Content */}
      <div className="relative z-20 p-10">
        <div className="flex items-center gap-3 mb-10">
          <Image src="/cst-logo.png" alt="CST Logo" width={48} height={48} />
          <h1 className="text-lg font-bold">CST ALUMNI PORTAL</h1>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Join the CST Community</h2>
          <p className="text-gray-300 mt-2">
            Students, alumni and staff can register here. Administrator accounts are
            created by the system administrator.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {SELF_SIGNUP_ROLES.map((role) => (
            <RoleCard key={role.key} role={role} />
          ))}
          {ADMIN_CREATED_ROLES.map((role) => (
            <RoleCard key={role.key} role={role} adminCreated />
          ))}
        </div>

        <p className="text-center text-sm text-gray-300 mt-10">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}