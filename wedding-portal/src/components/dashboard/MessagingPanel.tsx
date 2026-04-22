"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Mail, MessageCircle, Send, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, User
} from "lucide-react";

// ── Template messages ──────────────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  {
    label: "פולו-אפ לליד",
    subject: "המשך לשיחה שלנו 💛",
    body: `שלום {name},

תודה שפניתם אלינו! שמחנו לקבל את הפנייה שלכם ורוצים לוודא שיש לנו את כל הפרטים.

האם יהיה לכם נוח לשוחח בטלפון? נשמח לענות על כל שאלה ולהתאים הצעה מדויקת לצרכיכם.

בברכה`,
  },
  {
    label: "הצעת מחיר",
    subject: "הצעת מחיר לחתונה שלכם 💍",
    body: `שלום {name},

בהמשך לשיחתנו, אני שמח/ה לשלוח לכם הצעת מחיר מותאמת אישית.

אנא צרו קשר כדי לתאם פגישת היכרות ולדון בפרטים נוספים.

תודה ובברכה,`,
  },
  {
    label: "אישור פגישה",
    subject: "אישור פגישה 📅",
    body: `שלום {name},

אני מאשר/ת את פגישתנו.

אנא ליצור איתי קשר אם יש צורך לשנות את המועד.

מצפה לפגוש אתכם,`,
  },
];

const WA_TEMPLATES = [
  {
    label: "פנייה ראשונה",
    body: `שלום {name}! 👋
קיבלתי את פנייתך דרך WeddingPro.
אשמח לדבר איתך ולספר יותר על השירות שלנו.
מתי נוח לך לשיחה?`,
  },
  {
    label: "תזכורת",
    body: `שלום {name}! 😊
רצינו לבדוק אם יש לך שאלות נוספות לגבי השירות שלנו.
נשמח לעזור!`,
  },
  {
    label: "מחר החתונה",
    body: `שלום {name}! 💍
מחר היום הגדול! אנחנו כבר מוכנים ומחכים להפוך אותו לבלתי נשכח.
נדבר מחר בבוקר לאישור לוחות זמנים.
לילה טוב!`,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
}

interface HistoryItem {
  id: string;
  channel: string;
  recipient: string;
  subject: string | null;
  body: string;
  status: string;
  createdAt: string;
  leadName: string | null;
}

interface Props {
  leads: Lead[];
  history: HistoryItem[];
  waReady: boolean;
  waConfigured: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MessagingPanel({ leads, history, waReady, waConfigured }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id ?? "");
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sentMessages, setSentMessages] = useState<HistoryItem[]>(history);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  function applyTemplate(tmpl: { subject?: string; body: string }) {
    const name = selectedLead?.name ?? "";
    if (tmpl.subject) setSubject(tmpl.subject.replace("{name}", name));
    setBody(tmpl.body.replace(/{name}/g, name));
  }

  async function handleSend() {
    if (!selectedLeadId || !body.trim()) {
      toast.error("בחר ליד וכתוב הודעה");
      return;
    }
    if (channel === "whatsapp" && !selectedLead?.phone) {
      toast.error("לליד זה אין מספר טלפון");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/messaging/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          channel,
          subject: channel === "email" ? subject : undefined,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה");

      toast.success(`ההודעה נשלחה בהצלחה ✓`);
      // Add to local history
      setSentMessages((prev) => [
        {
          id: crypto.randomUUID(),
          channel,
          recipient: channel === "email" ? (selectedLead?.email ?? "") : (selectedLead?.phone ?? ""),
          subject: channel === "email" ? subject : null,
          body,
          status: "sent",
          createdAt: new Date().toISOString(),
          leadName: selectedLead?.name ?? null,
        },
        ...prev,
      ]);
      setBody("");
      setSubject("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בשליחה");
    } finally {
      setSending(false);
    }
  }

  const templates = channel === "email" ? EMAIL_TEMPLATES : WA_TEMPLATES;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── Compose panel (3/5) ── */}
      <div className="lg:col-span-3 space-y-4">

        {/* Channel selector */}
        <div className="flex bg-champagne/30 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setChannel("email")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              channel === "email" ? "bg-white text-obsidian shadow-sm" : "text-stone/60 hover:text-obsidian"
            }`}
          >
            <Mail className="h-4 w-4" />
            אימייל
          </button>
          <button
            type="button"
            onClick={() => setChannel("whatsapp")}
            disabled={!waConfigured}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 ${
              channel === "whatsapp" ? "bg-white text-obsidian shadow-sm" : "text-stone/60 hover:text-obsidian"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
            {waConfigured && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${waReady ? "bg-green-400" : "bg-amber-400"}`}
                title={waReady ? "מחובר" : "לא מחובר"}
              />
            )}
          </button>
        </div>

        {/* Lead selector */}
        <div>
          <label className="block text-xs font-semibold text-stone/60 uppercase tracking-wide mb-1.5">
            שלח ל
          </label>
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm border border-champagne bg-white text-obsidian focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
          >
            {leads.length === 0 && <option value="">— אין לידים —</option>}
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} — {channel === "whatsapp" ? (l.phone ?? "ללא טלפון") : l.email}
              </option>
            ))}
          </select>
        </div>

        {/* Templates */}
        <div>
          <p className="text-xs font-semibold text-stone/60 uppercase tracking-wide mb-2">תבניות מהירות</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t)}
                className="text-xs px-3 py-1.5 rounded-full border border-champagne bg-white hover:border-gold/50 hover:text-gold transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject (email only) */}
        {channel === "email" && (
          <div>
            <label className="block text-xs font-semibold text-stone/60 uppercase tracking-wide mb-1.5">
              נושא
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="נושא האימייל"
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-champagne bg-white text-obsidian focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
            />
          </div>
        )}

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-stone/60 uppercase tracking-wide">
              הודעה
            </label>
            <span className={`text-[10px] ${body.length > 2800 ? "text-amber-500" : "text-stone/40"}`}>
              {body.length}/3000
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={channel === "whatsapp" ? 5 : 8}
            maxLength={3000}
            placeholder={channel === "email" ? "תוכן האימייל..." : "הודעת WhatsApp..."}
            className="w-full px-4 py-3 rounded-xl text-sm border border-champagne bg-white text-obsidian focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none leading-relaxed"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !body.trim() || !selectedLeadId || (channel === "whatsapp" && !waReady)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #b8976a 0%, #9a7d56 100%)",
            boxShadow: "0 4px 16px rgba(184,151,106,0.3)",
          }}
        >
          {sending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> שולח...</>
          ) : (
            <><Send className="h-4 w-4" /> שלח {channel === "email" ? "אימייל" : "WhatsApp"}</>
          )}
        </button>

        {/* WA not ready warning */}
        {channel === "whatsapp" && waConfigured && !waReady && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            ⚠️ שירות WhatsApp לא מחובר. הפעל את המיקרו-שירות וסרוק QR כדי להתחבר.
          </p>
        )}
        {channel === "whatsapp" && !waConfigured && (
          <p className="text-xs text-stone/50 bg-champagne/20 rounded-xl px-4 py-2.5">
            להגדרת WhatsApp: הוסף <code className="font-mono bg-white px-1 rounded">WHATSAPP_SERVICE_URL</code> ו-<code className="font-mono bg-white px-1 rounded">WHATSAPP_SERVICE_API_KEY</code> ב-environment.
          </p>
        )}
      </div>

      {/* ── History panel (2/5) ── */}
      <div className="lg:col-span-2">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center justify-between w-full text-sm font-semibold text-obsidian mb-3"
        >
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-stone/40" />
            היסטוריית הודעות
            <span className="text-xs font-normal text-stone/40">({sentMessages.length})</span>
          </span>
          {showHistory ? <ChevronUp className="h-4 w-4 text-stone/40" /> : <ChevronDown className="h-4 w-4 text-stone/40" />}
        </button>

        {/* Always show on desktop, toggle on mobile */}
        <div className={`${showHistory ? "block" : "hidden lg:block"} space-y-2`}>
          {sentMessages.length === 0 ? (
            <p className="text-xs text-stone/40 text-center py-8">עדיין לא נשלחו הודעות</p>
          ) : (
            sentMessages.slice(0, 20).map((msg) => (
              <div
                key={msg.id}
                className="bg-white border border-champagne/60 rounded-xl p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {msg.channel === "email"
                      ? <Mail className="h-3.5 w-3.5 text-stone/40 shrink-0" />
                      : <MessageCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    }
                    <span className="text-xs font-medium text-obsidian truncate">
                      {msg.leadName ?? msg.recipient}
                    </span>
                  </div>
                  {msg.status === "sent"
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  }
                </div>
                {msg.subject && (
                  <p className="text-xs font-medium text-stone/70 truncate">{msg.subject}</p>
                )}
                <p className="text-xs text-stone/50 line-clamp-2">{msg.body}</p>
                <p className="text-[10px] text-stone/30">
                  {new Date(msg.createdAt).toLocaleDateString("he-IL", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
