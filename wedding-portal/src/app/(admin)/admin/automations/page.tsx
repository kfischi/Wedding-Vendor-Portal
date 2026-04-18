"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  MessageCircle,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Play,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
  TrendingUp,
  Activity,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AutomationLog {
  id: string;
  event: string;
  channel: string;
  status: "sent" | "failed" | "skipped" | "pending";
  durationMs: number | null;
  responseCode: number | null;
  error: string | null;
  createdAt: string;
}

interface LogStats {
  total: number;
  failed: number;
  sent: number;
  skipped: number;
}

interface WahaStatus {
  configured: boolean;
  connected: boolean;
  status: string;
  session: string | null;
  phone: string | null;
  name: string | null;
  qr: string | null;
  error?: string;
}

interface CoolifyApp {
  id: string;
  name: string;
  status: string;
  url: string | null;
}

interface CoolifyStatus {
  configured: boolean;
  version: string | null;
  apps: CoolifyApp[];
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  "lead.new": "ליד חדש",
  "lead.scored": "ניקוד ליד",
  "vendor.registered": "ספק נרשם",
  "vendor.payment_completed": "תשלום בוצע",
  "vendor.subscription_cancelled": "מנוי בוטל",
  "review.submitted": "ביקורת הוגשה",
  "blog.published": "בלוג פורסם",
  "seo.ping": "פינג SEO",
  "system.health_check": "בדיקת מערכת",
};

const CHANNEL_COLORS: Record<string, string> = {
  n8n: "#f59e0b",
  waha: "#22c55e",
  email: "#60a5fa",
  ai: "#a78bfa",
  cron: "#94a3b8",
};

const STATUS_DOT: Record<string, string> = {
  sent: "#34d399",
  failed: "#f87171",
  skipped: "#94a3b8",
  pending: "#fbbf24",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_DOT[status] ?? "#94a3b8";
  const labels: Record<string, string> = {
    sent: "נשלח",
    failed: "נכשל",
    skipped: "דולג",
    pending: "ממתין",
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}18`, color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {labels[status] ?? status}
    </span>
  );
}

function ServiceCard({
  title,
  icon: Icon,
  connected,
  subtitle,
  actions,
  children,
  accentColor,
}: {
  title: string;
  icon: React.ElementType;
  connected: boolean | null;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#1a1a1a",
        border: `1px solid ${connected === false ? "rgba(248,113,113,0.2)" : connected ? "rgba(52,211,153,0.2)" : "rgba(184,147,90,0.15)"}`,
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}18` }}
          >
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{title}</h3>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connected !== null && (
            <div className="flex items-center gap-1.5 text-xs">
              {connected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
                  <span style={{ color: "#34d399" }}>מחובר</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
                  <span style={{ color: "#f87171" }}>מנותק</span>
                </>
              )}
            </div>
          )}
          {actions}
        </div>
      </div>
      {children && <div className="p-5">{children}</div>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [waha, setWaha] = useState<WahaStatus | null>(null);
  const [coolify, setCoolify] = useState<CoolifyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; ms: number; error?: string }>>({});
  const [wahaStarting, setWahaStarting] = useState(false);
  const [coolifyRestarting, setCoolifyRestarting] = useState<string | null>(null);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);

    const [logsRes, wahaRes, coolifyRes] = await Promise.allSettled([
      fetch("/api/admin/automations/logs?limit=100"),
      fetch("/api/admin/waha/status"),
      fetch("/api/admin/coolify/status"),
    ]);

    if (logsRes.status === "fulfilled" && logsRes.value.ok) {
      const data = await logsRes.value.json();
      setLogs(data.logs ?? []);
      setStats(data.stats ?? null);
    }
    if (wahaRes.status === "fulfilled" && wahaRes.value.ok) {
      setWaha(await wahaRes.value.json());
    }
    if (coolifyRes.status === "fulfilled" && coolifyRes.value.ok) {
      setCoolify(await coolifyRes.value.json());
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const runTest = async (type: string) => {
    setTesting(type);
    try {
      const res = await fetch("/api/admin/automations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [type]: { ok: data.ok, ms: data.durationMs ?? 0, error: data.error },
      }));
      // Refresh logs after test
      setTimeout(() => fetchAll(true), 1500);
    } finally {
      setTesting(null);
    }
  };

  const startWaha = async () => {
    setWahaStarting(true);
    try {
      await fetch("/api/admin/waha/status", { method: "POST" });
      setTimeout(() => fetchAll(true), 3000);
    } finally {
      setWahaStarting(false);
    }
  };

  const restartCoolifyApp = async (appId: string) => {
    setCoolifyRestarting(appId);
    try {
      await fetch("/api/admin/coolify/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      setTimeout(() => fetchAll(true), 5000);
    } finally {
      setCoolifyRestarting(null);
    }
  };

  const cardStyle = {
    background: "#1a1a1a",
    border: "1px solid rgba(184,147,90,0.15)",
  };

  const n8nConfigured = !!process.env.NEXT_PUBLIC_APP_URL; // always true, just shows if URL is there
  const n8nConnected =
    stats !== null ? stats.total >= 0 : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#b8935a" }} />
      </div>
    );
  }

  const tests = [
    { id: "n8n.lead", label: 'N8N — ליד חדש', icon: Zap },
    { id: "n8n.vendor", label: "N8N — ספק נרשם", icon: Zap },
    { id: "n8n.blog", label: "N8N — בלוג פורסם", icon: Zap },
    { id: "n8n.seo", label: "N8N — פינג SEO", icon: Zap },
    { id: "waha.test", label: "WAHA — הודעת בדיקה", icon: MessageCircle },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">אוטומציות</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            N8N · WAHA · Coolify · ניטור בזמן אמת
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
          style={{
            background: "rgba(184,147,90,0.1)",
            border: "1px solid rgba(184,147,90,0.25)",
            color: "#b8935a",
          }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          רענן
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "סה״כ (24ש׳)", value: stats.total, icon: Activity, color: "#60a5fa" },
            { label: "נשלחו", value: stats.sent, icon: CheckCircle, color: "#34d399" },
            { label: "נכשלו", value: stats.failed, icon: XCircle, color: "#f87171" },
            { label: "דולגו", value: stats.skipped, icon: AlertCircle, color: "#94a3b8" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4" style={cardStyle}>
              <Icon className="w-4 h-4 mb-2" style={{ color }} />
              <p className="text-2xl font-bold" style={{ color }}>
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Service cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* N8N */}
        <ServiceCard
          title="N8N Automations"
          icon={Zap}
          connected={n8nConnected}
          subtitle="Webhook event orchestration"
          accentColor="#f59e0b"
          actions={
            <a
              href={process.env.NEXT_PUBLIC_N8N_URL ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              פתח N8N
            </a>
          }
        >
          <div className="space-y-2 text-sm">
            {["lead.new", "vendor.registered", "blog.published", "seo.ping"].map((ev) => {
              const count = logs.filter((l) => l.event === ev && l.channel === "n8n").length;
              return (
                <div key={ev} className="flex items-center justify-between">
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>
                    {EVENT_LABELS[ev] ?? ev}
                  </span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
                  >
                    {count} אירועים
                  </span>
                </div>
              );
            })}
          </div>
        </ServiceCard>

        {/* WAHA */}
        <ServiceCard
          title="WAHA WhatsApp"
          icon={MessageCircle}
          connected={waha?.connected ?? null}
          subtitle={waha?.phone ? `${waha.phone} · ${waha.name ?? ""}` : waha?.status ?? "לא מוגדר"}
          accentColor="#22c55e"
          actions={
            !waha?.connected && waha?.configured ? (
              <button
                onClick={startWaha}
                disabled={wahaStarting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  color: "#22c55e",
                }}
              >
                {wahaStarting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                הפעל
              </button>
            ) : null
          }
        >
          {waha?.qr ? (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "#fbbf24" }}>
                סרוק את הקוד עם WhatsApp
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={waha.qr}
                alt="WhatsApp QR Code"
                className="w-40 h-40 rounded-xl"
                style={{ background: "white", padding: "8px" }}
              />
            </div>
          ) : waha?.connected ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#34d399" }}>
              <CheckCircle className="w-4 h-4" />
              <span>WhatsApp מחובר ופעיל</span>
            </div>
          ) : !waha?.configured ? (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              הגדר WHATSAPP_SERVICE_URL ב-env
            </p>
          ) : (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {waha.error ?? "לא מחובר"}
            </p>
          )}
        </ServiceCard>

        {/* Coolify */}
        <ServiceCard
          title="Coolify Infrastructure"
          icon={Server}
          connected={coolify?.configured ? coolify.apps.length > 0 : null}
          subtitle={coolify?.version ? `v${coolify.version}` : "Self-hosted PaaS"}
          accentColor="#60a5fa"
        >
          {!coolify?.configured ? (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              הגדר COOLIFY_API_URL + COOLIFY_TOKEN ב-env
            </p>
          ) : coolify.apps.length === 0 ? (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              אין אפליקציות
            </p>
          ) : (
            <div className="space-y-2">
              {coolify.apps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background:
                          app.status === "running" ? "#34d399" : "#f87171",
                      }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>
                      {app.name}
                    </span>
                  </div>
                  <button
                    onClick={() => restartCoolifyApp(app.id)}
                    disabled={coolifyRestarting === app.id}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
                    style={{
                      background: "rgba(96,165,250,0.1)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    <RotateCcw
                      className={`w-3 h-3 ${coolifyRestarting === app.id ? "animate-spin" : ""}`}
                    />
                    Restart
                  </button>
                </div>
              ))}
            </div>
          )}
        </ServiceCard>
      </div>

      {/* Test panel */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div
          className="px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="font-display text-xl text-white">בדיקת חיבורים</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            שלח אירועי בדיקה לכל שירות
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tests.map(({ id, label, icon: Icon }) => {
            const result = testResults[id];
            return (
              <button
                key={id}
                onClick={() => runTest(id)}
                disabled={testing === id}
                className="flex items-center justify-between p-4 rounded-xl text-sm text-right transition-all"
                style={{
                  background:
                    result?.ok === true
                      ? "rgba(52,211,153,0.06)"
                      : result?.ok === false
                      ? "rgba(248,113,113,0.06)"
                      : "rgba(255,255,255,0.04)",
                  border:
                    result?.ok === true
                      ? "1px solid rgba(52,211,153,0.2)"
                      : result?.ok === false
                      ? "1px solid rgba(248,113,113,0.2)"
                      : "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: CHANNEL_COLORS[id.split(".")[0]] ?? "#94a3b8" }}
                  />
                  <span>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {result && (
                    <span
                      className="text-xs font-mono"
                      style={{
                        color: result.ok ? "#34d399" : "#f87171",
                      }}
                    >
                      {result.ok ? `✓ ${result.ms}ms` : `✗ ${result.error ?? "שגיאה"}`}
                    </span>
                  )}
                  {testing === id ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#b8935a" }} />
                  ) : (
                    <Play className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Event log */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <h2 className="font-display text-xl text-white">לוג אירועים</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              100 אחרונים · מתרענן כל 30 שניות
            </p>
          </div>
          <TrendingUp className="w-4 h-4" style={{ color: "#b8935a" }} />
        </div>

        {logs.length === 0 ? (
          <div className="p-16 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            אין אירועים עדיין. שלח בדיקה למעלה.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["אירוע", "ערוץ", "סטטוס", "זמן", "תאריך"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-xs font-medium text-right"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td className="px-5 py-3">
                      <div>
                        <span style={{ color: "rgba(255,255,255,0.8)" }}>
                          {EVENT_LABELS[log.event] ?? log.event}
                        </span>
                        {log.error && (
                          <p
                            className="text-xs mt-0.5 font-mono"
                            style={{ color: "#f87171" }}
                          >
                            {log.error.slice(0, 60)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wide"
                        style={{
                          background: `${CHANNEL_COLORS[log.channel] ?? "#94a3b8"}18`,
                          color: CHANNEL_COLORS[log.channel] ?? "#94a3b8",
                        }}
                      >
                        {log.channel}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-5 py-3">
                      {log.durationMs != null ? (
                        <span
                          className="flex items-center gap-1 text-xs font-mono"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          <Clock className="w-3 h-3" />
                          {log.durationMs}ms
                        </span>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
                      )}
                    </td>
                    <td
                      className="px-5 py-3 text-xs font-mono"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {new Date(log.createdAt).toLocaleString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
