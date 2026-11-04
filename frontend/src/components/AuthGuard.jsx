"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, HOME } from "@/lib/auth";

export default function AuthGuard({ role, children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (role && session.user.role !== role) {
      router.replace(HOME[session.user.role] || "/login");
      return;
    }
    setAllowed(true);
  }, [role, router]);

  if (!allowed) return null;
  return children;
}