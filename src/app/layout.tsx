import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import { ToastProvider, BottomNav } from "@/components/ui";
import AuthGate from "@/components/auth/AuthGate";
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
  title: "FriendsFest — Organize · Connect · Celebrate",
  description: "Organizza eventi di gruppo con i tuoi amici. Condividi su WhatsApp e gestisci tutto facilmente.",
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FriendsFest',
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
          <AuthGate>
            {children}
            <BottomNav />
          </AuthGate>
        </ToastProvider>
      </body>
    </html>
  );
}
