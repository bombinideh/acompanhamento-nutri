import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Controle de Hábitos",
  description: "Acompanhe sua rotina. Transforme sua vida.",
  applicationName: "Hábitos",
  appleWebApp: {
    capable: true,
    title: "Hábitos",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f6f5e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
