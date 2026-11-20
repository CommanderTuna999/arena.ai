import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neon Hive — hunt, harvest, evolve",
  description: "A neon open-world hunt: strip geometric insects of their parts, harvest their plating, craft weapons and abilities, and push toward the thing at the centre of the map.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#04050c" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#04050c] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
