import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

// Absolute base for OG/Twitter image URLs. Set NEXT_PUBLIC_SITE_URL to your
// production domain; otherwise it falls back to Vercel's deploy URL, then local.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const DESCRIPTION = "Track your family's daily expenses together — built for Dhaka households.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "HisabKitab (হিসাবকিতাব)",
  description: DESCRIPTION,
  applicationName: "HisabKitab",
  openGraph: {
    title: "HisabKitab (হিসাবকিতাব)",
    description: DESCRIPTION,
    siteName: "HisabKitab",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HisabKitab (হিসাবকিতাব)",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-stone-200 text-stone-900 antialiased`}>
        {/* Mobile-first column. A soft teal→amber wash gives the app a warm,
            colourful base while staying light enough that solid-white cards
            still read as distinct raised layers on top of it. */}
        <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-clip bg-gradient-to-b from-teal-100/70 via-stone-50 to-amber-50/60 shadow-md shadow-stone-900/10">
          {children}
        </div>
      </body>
    </html>
  );
}
