import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HisabKitab (হিসাবকিতাব)",
  description: "Family expense tracker for Dhaka households",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-stone-100 text-stone-900 antialiased`}>
        {/* Mobile-first: content constrained to a phone-width column */}
        <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-x-clip bg-gradient-to-b from-teal-50 via-stone-50 to-stone-100 shadow-sm">
          {/* Ambient glows — fixed so they don't scroll away */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-y-0 left-1/2 z-0 w-full max-w-md -translate-x-1/2 overflow-hidden"
          >
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-200/50 blur-3xl" />
            <div className="absolute -left-24 top-48 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl" />
          </div>
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
