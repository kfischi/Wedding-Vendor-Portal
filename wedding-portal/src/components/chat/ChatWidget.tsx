"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, MessageCircle, Send, Sparkles, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface VendorResult {
  id: string;
  slug: string;
  businessName: string;
  category: string;
  city: string;
  shortDescription: string | null;
  rating: number | null;
  reviewCount: number | null;
  plan: string;
  coverImage: string | null;
  url: string;
}

interface Plan {
  name: string;
  price: string;
  features: string[];
}

interface Message {
  id: string;
  role: Role;
  text: string;
  vendors?: VendorResult[];
  plans?: Plan[];
  isTyping?: boolean;
}

// ── Quick suggestions ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "מחפשים צלם לחתונה",
  "אולם אירועים בתל אביב",
  "אני ספק ורוצה להצטרף",
  "קייטרינג כשר",
  "DJ לחתונה",
];

// ── Category labels ───────────────────────────────────────────────────────────

const CAT: Record<string, string> = {
  photography: "צילום",
  videography: "וידאו",
  venue: "אולם",
  catering: "קייטרינג",
  flowers: "פרחים",
  music: "מוסיקה",
  dj: "DJ",
  makeup: "איפור",
  dress: "שמלה",
  cake: "עוגה",
  planning: "תכנון",
  transport: "הסעות",
  lighting: "תאורה",
  other: "אחר",
};

// ── Vendor card ───────────────────────────────────────────────────────────────

function VendorCard({ v }: { v: VendorResult }) {
  return (
    <Link
      href={v.url}
      target="_blank"
      className="flex gap-3 p-3 rounded-xl transition-all group"
      style={{
        background: "rgb(24 24 27)",
        border: "1px solid rgb(39 39 42)",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "rgb(63 63 70)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "rgb(39 39 42)")
      }
    >
      {/* Image */}
      <div
        className="w-14 h-14 rounded-lg shrink-0 overflow-hidden"
        style={{ background: "rgb(39 39 42)" }}
      >
        {v.coverImage ? (
          <Image
            src={v.coverImage}
            alt={v.businessName}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            🎊
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p
            className="text-sm font-medium leading-tight truncate"
            style={{ color: "rgb(250 250 250)" }}
          >
            {v.businessName}
          </p>
          <ExternalLink
            className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity mt-0.5"
            style={{ color: "rgb(201 168 84)" }}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs" style={{ color: "rgb(82 82 91)" }}>
            {CAT[v.category] ?? v.category}
          </span>
          <span style={{ color: "rgb(39 39 42)" }}>·</span>
          <span className="text-xs" style={{ color: "rgb(82 82 91)" }}>
            {v.city}
          </span>
          {v.plan === "premium" && (
            <>
              <span style={{ color: "rgb(39 39 42)" }}>·</span>
              <span className="text-xs font-medium" style={{ color: "rgb(201 168 84)" }}>
                ✦ פרמיום
              </span>
            </>
          )}
        </div>
        {v.shortDescription && (
          <p
            className="text-xs mt-1 line-clamp-1 leading-relaxed"
            style={{ color: "rgb(82 82 91)" }}
          >
            {v.shortDescription}
          </p>
        )}
        {v.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star
              className="h-3 w-3 fill-current"
              style={{ color: "rgb(201 168 84)" }}
            />
            <span className="text-xs font-medium" style={{ color: "rgb(201 168 84)" }}>
              {v.rating.toFixed(1)}
            </span>
            {v.reviewCount ? (
              <span className="text-xs" style={{ color: "rgb(82 82 91)" }}>
                ({v.reviewCount})
              </span>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, idx }: { plan: Plan; idx: number }) {
  const isPremium = idx === 1;
  return (
    <div
      className="p-3 rounded-xl"
      style={{
        background: isPremium ? "rgb(201 168 84 / 0.06)" : "rgb(24 24 27)",
        border: isPremium
          ? "1px solid rgb(201 168 84 / 0.3)"
          : "1px solid rgb(39 39 42)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: "rgb(250 250 250)" }}>
          {plan.name}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: isPremium ? "rgb(201 168 84)" : "rgb(212 212 216)" }}
        >
          {plan.price}
        </span>
      </div>
      <ul className="space-y-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-xs" style={{ color: "rgb(113 113 122)" }}>
            <span className="mt-0.5" style={{ color: isPremium ? "rgb(201 168 84)" : "rgb(82 82 91)" }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "rgb(113 113 122)",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "שלום! אני העוזר החכם של WeddingPro 💍\n\nאני יכול לעזור לכם למצוא את ספקי החתונה המושלמים, או להדריך ספקים שרוצים להצטרף לפלטפורמה.\n\nאיך אוכל לעזור?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // API messages format
  const apiMessages = messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({ role: m.role, content: m.text }));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text: text.trim(),
      };
      const typingMsg: Message = {
        id: "typing",
        role: "assistant",
        text: "",
        isTyping: true,
      };

      setMessages((prev) => [...prev, userMsg, typingMsg]);
      setInput("");
      setLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...apiMessages, { role: "user", content: text.trim() }],
          }),
        });

        if (!response.ok) throw new Error("Network error");

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let aiText = "";
        let vendors: VendorResult[] | undefined;
        let plans: Plan[] | undefined;
        const aiId = Date.now().toString() + "-ai";

        // Replace typing indicator with empty assistant message
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "typing"),
          { id: aiId, role: "assistant", text: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                aiText += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiId ? { ...m, text: aiText } : m
                  )
                );
              }
              if (data.type === "vendors") vendors = data.vendors;
              if (data.type === "plans") plans = data.data?.plans;
              if (data.type === "done") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiId ? { ...m, vendors, plans } : m
                  )
                );
              }
            } catch {}
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "typing"),
          {
            id: Date.now().toString(),
            role: "assistant",
            text: "מצטעריים, אירעה שגיאה. אנא נסו שנית.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, apiMessages]
  );

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-200 active:scale-95"
        style={{
          background: "rgb(15 15 18)",
          border: "1px solid rgb(39 39 42)",
          boxShadow:
            "0 0 0 1px rgb(39 39 42 / 0.5), 0 8px 32px rgb(0 0 0 / 0.6), 0 0 20px rgb(201 168 84 / 0.06)",
          display: open ? "none" : "flex",
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "rgb(201 168 84 / 0.15)" }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: "rgb(201 168 84)" }} />
        </div>
        <span className="text-sm font-medium" style={{ color: "rgb(212 212 216)" }}>
          עוזר AI
        </span>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: "rgb(34 197 94)",
            boxShadow: "0 0 6px rgb(34 197 94 / 0.6)",
          }}
        />
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 left-6 z-50 flex flex-col rounded-2xl overflow-hidden transition-all"
          style={{
            width: "min(400px, calc(100vw - 2rem))",
            height: "min(620px, calc(100vh - 6rem))",
            background: "rgb(9 9 11)",
            border: "1px solid rgb(39 39 42)",
            boxShadow:
              "0 0 0 1px rgb(39 39 42 / 0.5), 0 24px 80px rgb(0 0 0 / 0.8), 0 8px 32px rgb(0 0 0 / 0.5)",
            animation: "slideUp 0.2s ease-out",
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(12px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
          `}</style>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgb(39 39 42)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgb(201 168 84 / 0.1)",
                  border: "1px solid rgb(201 168 84 / 0.2)",
                }}
              >
                <Sparkles className="h-4 w-4" style={{ color: "rgb(201 168 84)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "rgb(250 250 250)" }}>
                  WeddingPro AI
                </p>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "rgb(34 197 94)",
                      boxShadow: "0 0 4px rgb(34 197 94 / 0.7)",
                    }}
                  />
                  <span className="text-xs" style={{ color: "rgb(82 82 91)" }}>
                    מחובר
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "rgb(82 82 91)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "rgb(212 212 216)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "rgb(82 82 91)")
              }
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
            dir="rtl"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgb(39 39 42) transparent",
            }}
          >
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.isTyping ? (
                  <div className="flex justify-start">
                    <div
                      className="px-3 py-2.5 rounded-2xl rounded-tr-sm"
                      style={{
                        background: "rgb(24 24 27)",
                        border: "1px solid rgb(39 39 42)",
                      }}
                    >
                      <TypingDots />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[88%] ${msg.role === "user" ? "space-y-2" : ""}`}
                    >
                      <div
                        className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                        style={
                          msg.role === "user"
                            ? {
                                background: "rgb(24 24 27)",
                                border: "1px solid rgb(39 39 42)",
                                color: "rgb(212 212 216)",
                                borderTopRightRadius: "4px",
                              }
                            : {
                                background: "rgb(201 168 84 / 0.08)",
                                border: "1px solid rgb(201 168 84 / 0.15)",
                                color: "rgb(228 228 231)",
                              }
                        }
                      >
                        {msg.text}
                      </div>

                      {/* Vendor cards */}
                      {msg.vendors && msg.vendors.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.vendors.map((v) => (
                            <VendorCard key={v.id} v={v} />
                          ))}
                        </div>
                      )}

                      {/* Plan cards */}
                      {msg.plans && msg.plans.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.plans.map((p, i) => (
                            <PlanCard key={p.name} plan={p} idx={i} />
                          ))}
                          <Link
                            href="/pricing"
                            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              background: "rgb(201 168 84)",
                              color: "rgb(9 9 11)",
                            }}
                          >
                            התחל ניסיון חינמי 3 חודשים
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only at start) */}
          {messages.length <= 1 && (
            <div
              className="px-3 pb-2 flex gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
              dir="rtl"
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: "rgb(24 24 27)",
                    border: "1px solid rgb(39 39 42)",
                    color: "rgb(161 161 170)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="px-3 pb-4 pt-2 shrink-0"
            style={{ borderTop: "1px solid rgb(39 39 42)" }}
            dir="rtl"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="שאל אותי כל דבר..."
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm transition-all outline-none"
                style={{
                  background: "rgb(24 24 27)",
                  border: "1px solid rgb(39 39 42)",
                  color: "rgb(212 212 216)",
                  fontSize: "0.875rem",
                }}
                onFocus={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "rgb(201 168 84 / 0.4)")
                }
                onBlur={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    "rgb(39 39 42)")
                }
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95"
                style={{
                  background:
                    input.trim() && !loading
                      ? "rgb(250 250 250)"
                      : "rgb(24 24 27)",
                  color:
                    input.trim() && !loading ? "rgb(9 9 11)" : "rgb(82 82 91)",
                  border: "1px solid rgb(39 39 42)",
                }}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            <p className="text-center text-[10px] mt-2" style={{ color: "rgb(63 63 70)" }}>
              מופעל על ידי Claude AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}
