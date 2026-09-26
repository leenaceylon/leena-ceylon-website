"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/account");
      router.refresh();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to sign in.");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-tea-bg/50">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-tea-border shadow-subtle space-y-6">
        {/* Official Brand Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <div className="relative h-14 w-44 mx-auto">
              <Image
                src="/brand/logo.png"
                alt="LEENA CEYLON"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-tea-dark">Customer Sign In</h1>
          <p className="text-xs text-tea-muted">
            Access your order history and live delivery tracking
          </p>
        </div>

        {status === "error" && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="kasun@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
              />
              <Mail className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-tea-border bg-tea-surface focus:outline-none focus:ring-2 focus:ring-tea-leaf/30 focus:border-tea-leaf"
              />
              <Lock className="w-4 h-4 text-tea-muted absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3.5 px-4 rounded-xl bg-tea-dark hover:bg-tea-forest text-white text-xs font-bold uppercase tracking-wider transition shadow-card hover:shadow-hover disabled:opacity-50"
          >
            {status === "loading" ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <div className="text-center text-xs text-tea-muted space-y-2 pt-2 border-t border-tea-border/60">
          <p>
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-tea-forest hover:underline">
              Create Account
            </Link>
          </p>
          <p>
            <Link href="/account" className="text-tea-leaf hover:underline text-[11px]">
              Looking to track an order without login? Track here →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
