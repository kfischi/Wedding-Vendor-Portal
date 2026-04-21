import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const CATEGORY_LABELS: Record<string, string> = {
  photography: "צלם חתונות",
  videography: "צלם וידאו",
  venue: "אולם אירועים",
  catering: "קייטרינג",
  flowers: "עיצוב פרחים",
  music: "מוזיקה חיה",
  dj: "DJ",
  makeup: "איפור כלה",
  dress: "שמלות כלה",
  suit: "חליפות חתן",
  cake: "עוגות חתונה",
  invitation: "הזמנות",
  transport: "הסעות",
  lighting: "תאורה",
  planning: "מתכנן חתונות",
  other: "ספק שירותים",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "WeddingPro";
  const category = searchParams.get("category") ?? "";
  const city = searchParams.get("city") ?? "";
  const imageUrl = searchParams.get("image");

  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1614 0%, #2d2420 60%, #3d2d28 100%)",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* Background image overlay */}
        {imageUrl && (
          <img
            src={imageUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        )}

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(26,22,20,0.9) 0%, rgba(26,22,20,0.5) 50%, rgba(26,22,20,0.3) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            padding: "48px",
          }}
        >
          {/* WeddingPro badge */}
          <div
            style={{
              display: "flex",
              background: "rgba(184,151,106,0.15)",
              border: "1px solid rgba(184,151,106,0.4)",
              borderRadius: "100px",
              padding: "6px 20px",
              color: "#b8976a",
              fontSize: "16px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            WeddingPro
          </div>

          {/* Category */}
          {categoryLabel && (
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "22px" }}>
              {categoryLabel}
            </div>
          )}

          {/* Business name */}
          <div
            style={{
              color: "#ffffff",
              fontSize: "68px",
              fontWeight: "bold",
              textAlign: "center",
              lineHeight: 1.1,
              textShadow: "0 4px 32px rgba(0,0,0,0.4)",
              maxWidth: "900px",
            }}
          >
            {name}
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: "64px",
              height: "2px",
              background: "rgba(184,151,106,0.7)",
              borderRadius: "2px",
            }}
          />

          {/* City */}
          {city && (
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "20px" }}>
              📍 {city}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
