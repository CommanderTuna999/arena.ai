import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wofgue.io",
  description: "Wofgue.io — a neon geometric hunting ground. Strip insects of their parts, craft weapons and abilities, and survive the deeper zones.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#04050c" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#04050c] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
