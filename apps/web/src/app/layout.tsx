import type { Metadata, Viewport } from 'next'; 
import { ReactNode } from 'react';
import { Montserrat, Open_Sans, Oswald } from 'next/font/google';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import '../styles/variables.css';
import '../styles/globals.css'; 


const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Cheepers - Pide tu comida',
  description: 'Hamburguesas, pizzas, lomitos y más. Entrega rápida en tu domicilio.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${montserrat.variable} ${openSans.variable} ${oswald.variable}`}>
      <body className="font-sans flex flex-col min-h-screen">
        <Header />
        <main className="pt-[70px] md:pt-[100px] flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
