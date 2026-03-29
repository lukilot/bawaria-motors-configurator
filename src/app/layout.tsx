import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GarageDrawer } from '@/components/layout/GarageDrawer';
import { InitialPreloader } from '@/components/layout/InitialPreloader';
import { NavigationPreloader } from '@/components/layout/NavigationPreloader';
import { CompareToolbar } from '@/components/cars/CompareToolbar';
import { CompareModal } from '@/components/cars/CompareModal';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { IntroOverlay } from '@/components/cars/IntroOverlay';
import { MobileStickyFooter } from '@/components/cars/MobileStickyFooter';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Bawaria Motors BMW Stock',
    default: 'Bawaria Motors | Nowe samochody BMW dostępne od ręki',
  },
  description: "Zapoznaj się z naszą ofertą nowych samochodów BMW dostępnych od ręki w Bawaria Motors. Najlepsze oferty, szybka realizacja.",
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: 'https://stock.bawariamotors.pl',
    siteName: 'Bawaria Motors BMW Stock',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <IntroOverlay />
        <SiteHeader />
        {children}
        <MobileStickyFooter />
        <GarageDrawer />
        <CompareToolbar />
        <CompareModal />
        <InitialPreloader />
        <NavigationPreloader />
      </body>
    </html>
  );
}
