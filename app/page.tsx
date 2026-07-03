import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0d2b3e] to-[#1a5276] text-white p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 font-arabic">نهج</h1>
        <p className="text-xl mb-2 text-blue-200">منصة الإدارة المالية الاحترافية</p>
        <p className="text-sm mb-8 text-blue-300">
          متوافق مع أنظمة هيئة السوق المالية (SAMA) وحماية البيانات الشخصية (PDPL) • البيانات مخزّنة في منطقة الرياض
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="bg-white text-[#1a5276] px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            لوحة التحكم
          </Link>
          <Link
            href="/api/health"
            className="border border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors"
          >
            فحص الخادم
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-bold mb-1">أمان عالي</h3>
            <p className="text-sm text-blue-200">تشفير كامل للبيانات في النقل والتخزين</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <div className="text-2xl mb-2">📍</div>
            <h3 className="font-bold mb-1">بيانات بالسعودية</h3>
            <p className="text-sm text-blue-200">AWS منطقة الرياض - PDPL متوافق</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-bold mb-1">سرعة فائقة</h3>
            <p className="text-sm text-blue-200">Serverless architecture - دفع حسب الاستخدام</p>
          </div>
        </div>
      </div>
    </main>
  )
}
