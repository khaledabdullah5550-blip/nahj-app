import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'نهج - منصة الإدارة المالية',
  description: 'منصة نهج للإدارة المالية - آمنة ومتوافقة مع متطلبات هيئة البيانات الشخصية (PDPL) وسامة (SAMA)',
  keywords: ['نهج', 'إدارة مالية', 'سعودية', 'PDPL', 'SAMA'],
  authors: [{ name: 'فريق نهج' }],
  creator: 'نهج',
  publisher: 'نهج',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0369a1' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-arabic antialiased min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
