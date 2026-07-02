import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/components/Common/I18nProvider';

export const metadata: Metadata = {
  title: 'Nahj Financial Platform',
  description: 'Beta MVP financial platform with Firebase and AI advisor.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-slate-50 text-slate-900">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
