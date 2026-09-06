import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
