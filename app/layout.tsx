import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'نهج | Nahj',
  description: 'منصة نهج الاحترافية - خدمات مالية متوافقة مع متطلبات هيئة السوق المالية وأنظمة حماية البيانات الشخصية',
  keywords: 'نهج, خدمات مالية, السعودية, PDPL, SAMA',
  authors: [{ name: 'فريق نهج' }],
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50 font-tajawal antialiased">
        {children}
      </body>
    </html>
  );
}
