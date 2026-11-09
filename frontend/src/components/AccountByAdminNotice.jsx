import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export default function AccountByAdminNotice({ roleLabel, loginRole }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <Image
          src="/cst-logo.png"
          alt="CST logo"
          width={64}
          height={64}
          style={{ width: 64, height: "auto" }}
          className="mx-auto mb-4"
        />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-primary">
          <ShieldCheck size={26} />
        </div>

        <h1 className="text-xl font-bold text-sidebar">
          {roleLabel} accounts are created by an administrator
        </h1>

        <p className="mt-3 text-sm text-muted">
          For security, {roleLabel.toLowerCase()} accounts can&apos;t be created
          from this page. Please contact the CST system administrator to get
          your account.
        </p>

        <Link
          href={`/login?role=${loginRole}`}
          className="mt-8 block w-full rounded-lg bg-sidebar py-3 text-sm font-semibold text-white hover:bg-[#0f1f3a]"
        >
          Go to {roleLabel} Login
        </Link>

        <Link
          href="/signup"
          className="mt-4 inline-block text-xs font-medium text-primary hover:underline"
        >
          ← Back to Role Selection
        </Link>
      </div>
    </div>
  );
}