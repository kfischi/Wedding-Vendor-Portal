import Link from "next/link";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  photography: "צילום",
  videography: "וידאו",
  venue: "אולמות",
  catering: "קייטרינג",
  flowers: "פרחים",
  music: "מוזיקה",
  dj: "DJ",
  makeup: "איפור",
  dress: "שמלות כלה",
  suit: "חליפות חתן",
  cake: "עוגות",
  invitation: "הזמנות",
  transport: "הסעות",
  lighting: "תאורה",
  planning: "תכנון",
  "wedding-dress-designers": "מעצבי שמלות כלה",
  other: "אחר",
};

interface VendorCardProps {
  id: string;
  slug: string;
  businessName: string;
  shortDescription: string | null;
  city: string;
  category: string;
  coverImage: string | null;
  plan: string;
  rating: number | null;
  reviewCount: number;
  featured?: boolean;
}

export function VendorCard({
  slug,
  businessName,
  shortDescription,
  city,
  category,
  coverImage,
  plan,
  rating,
  reviewCount,
  featured = false,
}: VendorCardProps) {
  return (
    <Link
      href={`/vendors/${slug}`}
      className={cn(
        "group block bg-cream-white rounded-2xl overflow-hidden card-shadow",
        "hover:shadow-lg transition-shadow duration-300",
        featured && "ring-1 ring-gold/30"
      )}
    >
      {/* Cover image */}
      <div className="relative h-52 overflow-hidden bg-champagne/40">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={businessName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-champagne to-blush/30" />
        )}
        {/* Plan badge */}
        {plan === "premium" && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-obsidian/80 text-gold backdrop-blur-sm">
            Premium
          </span>
        )}
        {/* Category badge */}
        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-ivory/90 text-stone backdrop-blur-sm">
          {CATEGORY_LABELS[category] ?? category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-obsidian leading-tight group-hover:text-dusty-rose transition-colors">
            {businessName}
          </h3>
          {rating != null && (
            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span className="text-xs font-medium text-obsidian">{rating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="text-xs text-stone">({reviewCount})</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-stone">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs">{city}</span>
        </div>

        {shortDescription && (
          <p className="text-sm text-stone leading-relaxed line-clamp-2">
            {shortDescription}
          </p>
        )}

        <span className="inline-block mt-1 text-xs font-medium text-dusty-rose group-hover:underline">
          צפה בפרופיל ←
        </span>
      </div>
    </Link>
  );
}
