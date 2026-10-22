import type { Metadata } from "next";
import { Caveat_Brush, Inter } from "next/font/google";
import { SIDEBAR_PREFERENCE_SCRIPT } from "@/lib/sidebar-preference";
import { THEME_PREFERENCE_SCRIPT } from "@/lib/theme-preference";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const caveatBrush = Caveat_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-caveat-brush",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Frankie Fit",
  description:
    "Frankie Fit is an AI-native wellness coach for exercise, diet, and overall wellness."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme, data-sidebar, and --sidebar-width are set before paint by the inline script, so React
    // will see attributes it didn't render.
    <html lang="en" className={`${inter.variable} ${caveatBrush.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_PREFERENCE_SCRIPT + SIDEBAR_PREFERENCE_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
