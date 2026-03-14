import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Mail, Phone, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "צור קשר | WeddingPro",
  description: "יש לכם שאלה? צרו קשר עם צוות WeddingPro ונשמח לעזור.",
};

const CONTACT_INFO = [
  { icon: Mail,  label: "אימייל",          value: "support@weddingpro.co.il", href: "mailto:support@weddingpro.co.il" },
  { icon: Phone, label: "טלפון",           value: "03-000-0000",              href: "tel:030000000" },
  { icon: Clock, label: "שעות פעילות",     value: "א׳–ה׳, 09:00–18:00",      href: null },
];

const QUICK_LINKS = [
  { q: "איך מצטרפים כספק?",           href: "/join" },
  { q: "מה כוללות החבילות?",          href: "/pricing" },
  { q: "איך מנהלים את הפרופיל?",     href: "/blog" },
  { q: "מדיניות ביטול והחזרים",       href: "/terms" },
];

export default function ContactPage() {
  return (
    <>
      <main dir="rtl" className="min-h-screen bg-[#faf9f7]">
        {/* Hero */}
        <section className="bg-white border-b border-champagne/60 py-16 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="h-7 w-7 text-gold" />
            </div>
            <p className="font-script text-2xl text-gold mb-2">אנחנו כאן</p>
            <h1 className="font-display text-4xl lg:text-5xl text-obsidian leading-tight mb-4">
              צרו קשר
            </h1>
            <p className="text-stone/60 text-lg">
              שאלה? בעיה? רעיון? נשמח לשמוע מכם.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid lg:grid-cols-[1fr_340px] gap-10">

            {/* Form */}
            <div className="bg-white rounded-2xl border border-champagne/60 p-6 lg:p-8 shadow-sm">
              <h2 className="font-display text-2xl text-obsidian mb-6">שלחו הודעה</h2>
              <ContactForm />
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Contact info */}
              <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
                <h3 className="font-semibold text-obsidian text-sm mb-4">פרטי יצירת קשר</h3>
                <div className="space-y-4">
                  {CONTACT_INFO.map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-champagne/40 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 text-stone/60" />
                      </div>
                      <div>
                        <p className="text-xs text-stone/50 mb-0.5">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="text-sm font-medium text-obsidian hover:text-gold transition-colors" dir="ltr">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-obsidian">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ quick links */}
              <div className="bg-white rounded-2xl border border-champagne/60 p-5 shadow-sm">
                <h3 className="font-semibold text-obsidian text-sm mb-4">שאלות נפוצות</h3>
                <div className="space-y-2">
                  {QUICK_LINKS.map((link) => (
                    <a
                      key={link.q}
                      href={link.href}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-champagne/30 transition-colors group"
                    >
                      <span className="text-sm text-stone/70 group-hover:text-obsidian transition-colors">{link.q}</span>
                      <span className="text-gold text-xs opacity-0 group-hover:opacity-100 transition-opacity">←</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
