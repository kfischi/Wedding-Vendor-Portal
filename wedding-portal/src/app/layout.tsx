import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo, Great_Vibes } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-cormorant",
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const heebo = Heebo({
  variable: "--font-inter",
  subsets: ["latin", "hebrew"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Wedding Vendor Portal | ספקי חתונות בישראל",
    template: "%s | Wedding Vendor Portal",
  },
  description:
    "הפלטפורמה המובילה לספקי חתונות בישראל. מצאו צלמים, קייטרינג, מקומות אירוע ועוד.",
  keywords: ["חתונה", "ספקי חתונות", "ישראל", "צלם חתונות", "קייטרינג"],
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Wedding Vendor Portal",
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
      className={`${frankRuhl.variable} ${heebo.variable} ${greatVibes.variable}`}
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
