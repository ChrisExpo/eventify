import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider, BottomNav } from "@/components/ui";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '600', '700'],
  variable: "--font-headline",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#140727",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Eventify — Organizza eventi",
  description: "Crea e gestisci eventi in modo semplice. Condividi con amici e raccogli le adesioni senza stress.",
  // manifest.webmanifest è servito automaticamente da Next.js tramite src/app/manifest.ts
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Eventify',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col bg-background text-on-surface font-body">
        <ToastProvider>
          {children}
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
