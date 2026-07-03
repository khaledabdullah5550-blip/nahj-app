import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'نهج | منصة الإدارة المالية',
  description: 'منصة نهج للإدارة المالية - آمنة ومتوافقة مع أنظمة هيئة السوق المالية وحماية البيانات الشخصية',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
