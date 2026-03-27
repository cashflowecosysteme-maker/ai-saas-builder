import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Affiliation Pro - Programme d'Affiliation 3 Niveaux",
  description: "La plateforme d'affiliation premium avec commissions sur 3 niveaux. Gagnez 25% + 10% + 5% sur chaque vente. Intégration Systeme.io incluse.",
  keywords: ["affiliation", "marketing", "commission", "revenus passifs", "systeme.io", "3 niveaux"],
  authors: [{ name: "Affiliation Pro" }],
  openGraph: {
    title: "Affiliation Pro - Programme d'Affiliation 3 Niveaux",
    description: "La plateforme d'affiliation premium avec commissions sur 3 niveaux.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
