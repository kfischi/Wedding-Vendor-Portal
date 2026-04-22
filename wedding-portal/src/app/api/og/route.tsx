/**
 * Dynamic OG image generation.
 * Usage: /api/og?name=Studio+Niv&category=צלם+חתונות&city=תל+אביב&rating=4.9&plan=premium
 *
 * Returns a 1200×630 PNG image with WeddingPro branding.
 * Uses ImageResponse from next/og (Edge-compatible).
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Only basic fonts available in Edge — we use system fonts
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name     = searchParams.get("name")     ?? "WeddingPro";
  const category = searchParams.get("category") ?? "";
  const city     = searchParams.get("city")     ?? "";
  const rating   = searchParams.get("rating")   ?? "";
  const plan     = searchParams.get("plan")     ?? "free";
  const image    = searchParams.get("image")    ?? "";

  const isPremium = plan === "premium";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          position: "relative",
          fontFamily: "Georgia, serif",
          direction: "rtl",
          background: "#1a1614",
          overflow: "hidden",
        }}
      >
        {/* Background image */}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.55,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)",
          }}
        />

        {/* Gold bottom glow */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
            background:
              "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(184,151,106,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: 64,
            paddingLeft: 60,
            paddingRight: 60,
            gap: 0,
            width: "100%",
            textAlign: "center",
          }}
        >
          {/* Category */}
          {category && (
            <div
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 24,
                marginBottom: 10,
                letterSpacing: "0.05em",
              }}
            >
              {category}
            </div>
          )}

          {/* Business name */}
          <div
            style={{
              color: "#ffffff",
              fontSize: 72,
              fontStyle: "italic",
              lineHeight: 1.1,
              marginBottom: 18,
              textShadow: "0 4px 48px rgba(0,0,0,0.5)",
            }}
          >
            {name}
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: 80,
              height: 1,
              background: "rgba(184,151,106,0.7)",
              marginBottom: 18,
            }}
          />

          {/* City + Rating row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              color: "rgba(255,255,255,0.65)",
              fontSize: 20,
              marginBottom: 24,
            }}
          >
            {city && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                📍 {city}
              </span>
            )}
            {rating && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                ⭐ {rating}
              </span>
            )}
          </div>

          {/* WeddingPro logo bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 999,
              padding: "10px 24px",
            }}
          >
            {isPremium && (
              <span
                style={{
                  background: "rgba(184,151,106,0.25)",
                  border: "1px solid rgba(184,151,106,0.5)",
                  color: "#e8c97a",
                  fontSize: 12,
                  fontWeight: "bold",
                  padding: "2px 10px",
                  borderRadius: 999,
                }}
              >
                ⭐ מומלץ
              </span>
            )}
            <span style={{ color: "#b8976a", fontSize: 18, fontWeight: "bold" }}>
              WeddingPro
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              weddingpro.co.il
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
