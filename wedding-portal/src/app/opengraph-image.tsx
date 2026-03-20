import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WeddingPro — ספקי חתונות מובחרים בישראל";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#1a1614",
        }}
      >
        {/* Background: wedding rings photo from hero */}
        { }
        <img
          src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&h=630&fit=crop&crop=center&q=85"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Dark gradient overlay — stronger on left (RTL: text side) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to left, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.80) 100%)",
          }}
        />

        {/* Content — right-aligned for Hebrew RTL feel */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "64px 80px",
            width: "100%",
            gap: 0,
          }}
        >
          {/* Gold accent line */}
          <div
            style={{
              width: 56,
              height: 3,
              backgroundColor: "#C9A854",
              marginBottom: 24,
              borderRadius: 2,
            }}
          />

          {/* Brand name */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            WeddingPro
          </div>

          {/* Hebrew tagline */}
          <div
            style={{
              fontSize: 34,
              fontWeight: 400,
              color: "rgba(255,255,255,0.82)",
              marginTop: 20,
              letterSpacing: "0.5px",
            }}
          >
            ספקי חתונות מובחרים בישראל
          </div>

          {/* Sub-tagline */}
          <div
            style={{
              fontSize: 22,
              color: "#C9A854",
              marginTop: 14,
              fontWeight: 400,
            }}
          >
            500+ ספקים · צלמים · אולמות · קייטרינג ועוד
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
