import type { Metadata } from "next";
import { Archivo_Black, Black_Ops_One, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Archivo_Black({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const rankFont = Black_Ops_One({
  variable: "--font-rank",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "UltraTiers",
  description: "Minecraft PvP rankings, rebuilt as a clean Next.js leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${displayFont.variable} ${bodyFont.variable} ${rankFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
