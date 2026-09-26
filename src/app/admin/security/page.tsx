"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Clock, Activity, Lock, AlertCircle } from "lucide-react";

export default function AdminSecurityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/security")
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-widest text-tea-leaf font-bold">
          System Auditing & Integrity
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-tea-dark">
          Administrative Activity Logs
        </h1>
        <p className="text-xs text-tea-muted mt-0.5">
          Immutable audit trail of pricing modifications, order fulfillment updates, and catalog events
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium">Session Encryption</span>
            <span className="font-bold text-sm text-emerald-800 mt-1 block">
              JOSE / HS256 Encrypted
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">HTTP-Only secure cookies</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium">Password Hashing</span>
            <span className="font-bold text-sm text-emerald-800 mt-1 block">
              Bcrypt (Cost factor 10)
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">Zero plaintext exposure</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tea-leaf/10 text-tea-forest flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-tea-border shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-tea-muted font-medium">Recorded Events</span>
            <span className="font-serif text-2xl font-bold text-tea-dark mt-1 block">
              {logs.length}
            </span>
            <span className="text-[11px] text-tea-muted mt-0.5 block">Logged operations</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-tea-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-tea-muted">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-tea-muted">No security events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-tea-surface border-b border-tea-border text-tea-muted font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tea-border/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-tea-surface/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-tea-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-tea-dark">
                      {log.adminName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-tea-bg text-tea-forest">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-tea-dark max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-tea-muted font-mono text-[11px]">
                      {log.entityType ? `${log.entityType} (${log.entityId?.slice(0, 8)}...)` : "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
