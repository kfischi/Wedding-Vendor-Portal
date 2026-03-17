import { Phone, Globe, Instagram, Mail, Facebook } from "lucide-react";
import type { Vendor } from "@/lib/db/schema";
import { PLAN_LIMITS } from "@/lib/stripe/config";
import { WhatsAppButton } from "@/components/vendor/WhatsAppButton";

export function VendorInfo({ vendor }: { vendor: Vendor }) {
  const planLimits = PLAN_LIMITS[vendor.plan];
  return (
    <section className="bg-cream-white rounded-2xl card-shadow border border-champagne/60 p-8">
      <div className="grid md:grid-cols-3 gap-8">
        {/* תיאור */}
        <div className="md:col-span-2">
          <h2 className="font-display text-3xl text-obsidian mb-4">
            על {vendor.businessName}
          </h2>
          {vendor.description ? (
            <p className="text-stone leading-relaxed whitespace-pre-line">
              {vendor.description}
            </p>
          ) : (
            <p className="text-stone/50 italic">אין תיאור עדיין</p>
          )}
        </div>

        {/* פרטי קשר */}
        <div className="space-y-3">
          <h3 className="font-medium text-obsidian text-sm uppercase tracking-wider mb-4">
            צרו קשר
          </h3>

          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              className="flex items-center gap-3 text-stone hover:text-dusty-rose transition-colors group"
            >
              <span className="p-2 rounded-xl bg-champagne/40 group-hover:bg-dusty-rose/10 transition-colors">
                <Phone className="h-4 w-4" />
              </span>
              <span dir="ltr" className="text-sm">
                {vendor.phone}
              </span>
            </a>
          )}

          {vendor.email && (
            <a
              href={`mailto:${vendor.email}`}
              className="flex items-center gap-3 text-stone hover:text-dusty-rose transition-colors group"
            >
              <span className="p-2 rounded-xl bg-champagne/40 group-hover:bg-dusty-rose/10 transition-colors">
                <Mail className="h-4 w-4" />
              </span>
              <span className="text-sm break-all">{vendor.email}</span>
            </a>
          )}

          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-stone hover:text-dusty-rose transition-colors group"
            >
              <span className="p-2 rounded-xl bg-champagne/40 group-hover:bg-dusty-rose/10 transition-colors">
                <Globe className="h-4 w-4" />
              </span>
              <span className="text-sm truncate">
                {vendor.website.replace(/^https?:\/\//, "")}
              </span>
            </a>
          )}

          {vendor.instagram && (
            <a
              href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-stone hover:text-dusty-rose transition-colors group"
            >
              <span className="p-2 rounded-xl bg-champagne/40 group-hover:bg-dusty-rose/10 transition-colors">
                <Instagram className="h-4 w-4" />
              </span>
              <span className="text-sm">
                @{vendor.instagram.replace("@", "")}
              </span>
            </a>
          )}

          {vendor.facebook && (
            <a
              href={vendor.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-stone hover:text-dusty-rose transition-colors group"
            >
              <span className="p-2 rounded-xl bg-champagne/40 group-hover:bg-dusty-rose/10 transition-colors">
                <Facebook className="h-4 w-4" />
              </span>
              <span className="text-sm">Facebook</span>
            </a>
          )}

          {planLimits.hasWhatsApp && (
            <div className="pt-1">
              <WhatsAppButton phone={vendor.whatsapp ?? vendor.phone} inline />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
