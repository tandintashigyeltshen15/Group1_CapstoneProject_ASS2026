"use client";

import { useState } from "react";
import Button from "@/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 w-full max-w-sm"
      >
        <h1 className="text-xl font-bold text-text mb-6">CST Alumni Portal</h1>

        <label className="block text-sm text-muted mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-sm"
          placeholder="you@example.com"
          required
        />

        <label className="block text-sm text-muted mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 text-sm"
          placeholder="••••••••"
          required
        />

        <Button type="submit" variant="primary">
          Log In
        </Button>
      </form>
    </div>
  );
}