"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
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
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.admin?.role === "SHOP_ORDER_REP") {
        router.push("/admin/shop-billing");
      } else {
        router.push("/admin/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to sign in to admin dashboard.");
    }
  };

  return (
    <div className="min-h-screen bg-tea-dark flex flex-col justify-center items-center p-4 selection:bg-tea-leaf selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-hover border border-tea-border p-8 sm:p-10 space-y-6">
        {/* Official LEENA CEYLON Brand Logo */}
        <div className="text-center space-y-3">
          <div className="relative h-14 w-44 mx-auto">
            <Image
              src="/brand/logo.png"
              alt="LEENA CEYLON"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-tea-dark">Admin Console</h1>
            <p className="text-xs text-tea-muted mt-0.5">
              Secure administrative access for LEENA CEYLON operations
            </p>
          </div>
        </div>

        {status === "error" && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tea-dark mb-1">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@leenaceylon.com"
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
                placeholder="••••••••••••"
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
            {status === "loading" ? "AUTHENTICATING..." : "ENTER DASHBOARD"}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-tea-border/60">
          <p className="text-[11px] text-tea-muted flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-tea-leaf" />
            Encrypted session • Role-Based Access Control
          </p>
        </div>
      </div>
    </div>
  );
}
