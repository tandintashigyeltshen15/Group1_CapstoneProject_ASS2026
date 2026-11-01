"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Send, ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO (backend phase): POST /api/auth/forgot-password with { email }
    // The server answers the same way whether or not the account exists.
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout
        icon={Mail}
        title="Check Your Email"
        text="If your account exists, we've sent a password reset link to your email address."
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-primary">
            <MailCheck size={28} />
          </div>
          <h1 className="text-xl font-bold text-sidebar">Email Sent!</h1>
          <p className="mt-3 text-sm text-text">
            If an account exists for <span className="font-semibold text-sidebar">{email}</span>,
            we&apos;ve sent a password reset link to it.
          </p>
          <p className="mt-3 text-xs text-muted">
            Please check your inbox (and spam folder). The link will expire in 15 minutes.
          </p>

          <Link
            href="/login"
            className="mt-8 block w-full rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white hover:bg-[#0f1f3a]"
          >
            Back to Login
          </Link>
          <button
            onClick={() => setSent(false)}
            className="mt-4 text-xs font-medium text-primary hover:underline"
          >
            Use a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Reset Your Password"
      text="No worries! Enter your registered email address and we'll send you a secure link to reset your password."
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-primary">
            <Mail size={28} />
          </div>
          <h1 className="text-xl font-bold text-sidebar">Forgot Your Password?</h1>
          <p className="mt-2 text-sm text-muted">
            Enter your registered email address and we&apos;ll send you a secure link to reset your
            password.
          </p>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-sidebar">Email Address</label>
        <div className="relative mb-5">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9AA6BC]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email address"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-[#D7E0EE] py-3 pl-11 pr-4 text-sm text-[#192B50] placeholder:text-[#9AA6BC] focus:border-primary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar py-3 text-[15px] font-semibold text-white hover:bg-[#0f1f3a]"
        >
          <Send size={16} /> Send Reset Link
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-gray-200" /> OR <span className="h-px flex-1 bg-gray-200" />
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="mt-8 flex items-start gap-3 rounded-lg bg-blue-50 p-4">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-sidebar">Need more help?</p>
            <p className="text-xs text-muted">Contact the CST Alumni Portal support team.</p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}