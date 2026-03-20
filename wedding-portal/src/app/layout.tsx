import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Great_Vibes } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://portal.suite-hagit.co.il";

export const metadata: Metadata = {
  title: {
    default: "WeddingPro | ספקי חתונות בישראל",
    template: "%s | WeddingPro",
  },
  description:
    "הפלטפורמה המובילה לספקי חתונות בישראל. מצאו צלמים, קייטרינג, מקומות אירוע ועוד.",
  keywords: ["חתונה", "ספקי חתונות", "ישראל", "צלם חתונות", "קייטרינג"],
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: APP_URL,
    siteName: "WeddingPro",
    title: "WeddingPro | ספקי חתונות מובחרים בישראל",
    description:
      "מעל 500 ספקי חתונות מובחרים בישראל — צלמים, אולמות, קייטרינג, פרחים ועוד. מצאו את הספקים המושלמים לחתונה שלכם.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "WeddingPro — ספקי חתונות מובחרים בישראל",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeddingPro | ספקי חתונות מובחרים בישראל",
    description:
      "מעל 500 ספקי חתונות מובחרים בישראל — צלמים, אולמות, קייטרינג ועוד.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${cormorant.variable} ${inter.variable} ${greatVibes.variable}`}
    >
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          dir="rtl"
          toastOptions={{
            style: {
              background: "rgb(255 253 250)",
              border: "1px solid rgb(232 221 208)",
              color: "rgb(26 22 20)",
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </body>
    </html>
  );
}
