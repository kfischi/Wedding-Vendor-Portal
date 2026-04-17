"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2, Zap } from "lucide-react";

interface Check {
  name: string;
  status: "ok" | "warn" | "error";
  latencyMs?: number;
  detail: string;
}

interface StatusData {
  overall: "ok" | "warn" | "error";
  timestamp: string;
  checks: Check[];
}

const POLL_INTERVAL = 30_000; // 30 seconds

function StatusIcon({ status }: { status: "ok" | "warn" | "error" }) {
  if (status === "ok")   return <CheckCircle2  className="w-4 h-4 flex-shrink-0" style={{ color: "#34d399" }} />;
  if (status === "warn") return <AlertTriangle  className="w-4 h-4 flex-shrink-0" style={{ color: "#fbbf24" }} />;
  return                        <XCircle        className="w-4 h-4 flex-shrink-0" style={{ color: "#f87171" }} />;
}

function statusColor(s: "ok" | "warn" | "error") {
  return s === "ok" ? "#34d399" : s === "warn" ? "#fbbf24" : "#f87171";
}

function statusBg(s: "ok" | "warn" | "error") {
  return s === "ok"
    ? "rgba(52,211,153,0.08)"
    : s === "warn"
    ? "rgba(251,191,36,0.08)"
    : "rgba(248,113,113,0.08)";
}

function statusBorder(s: "ok" | "warn" | "error") {
  return s === "ok"
    ? "1px solid rgba(52,211,153,0.2)"
    : s === "warn"
    ? "1px solid rgba(251,191,36,0.2)"
    : "1px solid rgba(248,113,113,0.2)";
}

function MigrationRunner() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; results: { statement: string; status: string; detail: string }[] } | null>(null);

  async function runMigration() {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/run-migration", { method: "POST" });
      setResult(await res.json());
    } catch {
      setResult({ ok: false, results: [{ statement: "", status: "error", detail: "שגיאת רשת" }] });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: "#fbbf24" }}>Migration — enum values חסרים</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            מוסיף bridal-preparation ו-wedding-dress-designers לטבלת ה-DB
          </p>
        </div>
        <button
          onClick={runMigration}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {running ? "מריץ..." : "הרץ migration"}
        </button>
      </div>

      {result && (
        <div className="mt-3 space-y-1.5">
          {result.results.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <StatusIcon status={r.status === "ok" ? "ok" : "error"} />
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{r.detail}</span>
            </div>
          ))}
          {result.ok && (
            <p className="text-xs mt-2" style={{ color: "#34d399" }}>
              ✅ Migration הצליח — רענן את הסטטוס
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MonitorPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/status");
      if (res.ok) {
        setData(await res.json());
        setLastFetch(new Date());
        setCountdown(POLL_INTERVAL / 1000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [lastFetch]);

  const hasEnumError = data?.checks.find(c => c.name === "vendor_category Enum" && c.status === "error");

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">ניטור מערכת</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            בדיקה אוטומטית כל 30 שניות
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              רענון בעוד {countdown}ש׳
            </span>
          )}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            רענן
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      {data && (
        <div
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: statusBg(data.overall), border: statusBorder(data.overall) }}
        >
          <div className="w-3 h-3 rounded-full animate-pulse flex-shrink-0" style={{ background: statusColor(data.overall) }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: statusColor(data.overall) }}>
              {data.overall === "ok" ? "כל המערכות פועלות תקין" :
               data.overall === "warn" ? "פועל עם אזהרות" : "יש בעיות — נדרשת התייחסות"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              עדכון אחרון: {lastFetch ? new Date(lastFetch).toLocaleTimeString("he-IL") : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Migration runner — show only if enum is broken */}
      {hasEnumError && <MigrationRunner />}

      {/* Checks */}
      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />
        </div>
      )}

      {data && (
        <div className="space-y-3">
          {data.checks.map(check => (
            <div
              key={check.name}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: "#1a1a1a", border: statusBorder(check.status) }}
            >
              <StatusIcon status={check.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{check.name}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {check.detail}
                </p>
              </div>
              {check.latencyMs !== undefined && (
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-lg flex-shrink-0"
                  style={{
                    background: check.latencyMs < 300 ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                    color: check.latencyMs < 300 ? "#34d399" : "#fbbf24",
                  }}
                >
                  {check.latencyMs}ms
                </span>
              )}
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: statusBg(check.status),
                  color: statusColor(check.status),
                  border: statusBorder(check.status),
                }}
              >
                {check.status === "ok" ? "תקין" : check.status === "warn" ? "אזהרה" : "שגיאה"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
