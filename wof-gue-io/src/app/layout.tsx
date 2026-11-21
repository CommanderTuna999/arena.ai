import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { VERSION } from "@/game/changelog";
import "./globals.css";

export const metadata: Metadata = {
  /* The tab says exactly this, on every page. */
  title: { default: "wofgue", template: "%s" },
  description: "wofgue — a neon geometric hunting ground. Strip insects of their parts, craft weapons and abilities, and survive the deeper zones.",
  applicationName: "wofgue",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }], shortcut: "/icon.svg" },
  openGraph: { title: "wofgue", siteName: "wofgue.io", description: "Hunt geometric insects. Strip their plating, shear their limbs, then break the core." },
  other: { "wof-version": VERSION },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#04050c" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#04050c] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
