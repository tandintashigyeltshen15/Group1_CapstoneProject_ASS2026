"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, HOME } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    router.replace(session ? HOME[session.user.role] || "/signup" : "/signup");
  }, [router]);

  return null;
}