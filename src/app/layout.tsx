import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { InstallBanner } from '@/components/InstallBanner';

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/icon-192x192.png',
  },
  title: 'SkyBook — Flight Management',
  description: 'Search, book, and manage your flights with ease.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SkyBook',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <Navbar />
        <InstallBanner />
        <main className="min-h-screen">{children}</main>
        <footer className="mt-16 border-t border-slate-100 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} SkyBook. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
