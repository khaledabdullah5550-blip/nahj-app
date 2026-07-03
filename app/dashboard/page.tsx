export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#ecf0f1] p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <header className="bg-[#1a5276] text-white rounded-xl p-4 mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold font-arabic">نهج - لوحة التحكم</h1>
          <span className="text-sm text-blue-200">مرحباً بك</span>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'الرصيد الإجمالي', value: '٠ ريال', color: 'bg-[#1a5276]' },
            { label: 'الإيرادات', value: '٠ ريال', color: 'bg-[#16a085]' },
            { label: 'المصروفات', value: '٠ ريال', color: 'bg-[#c0392b]' },
            { label: 'الادخار', value: '٠ ريال', color: 'bg-[#e67e22]' },
          ].map((card) => (
            <div key={card.label} className={`${card.color} text-white rounded-xl p-4`}>
              <p className="text-sm opacity-80">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#2c3e50] mb-4">المعاملات الأخيرة</h2>
          <p className="text-[#7f8c8d] text-center py-8">لا توجد معاملات بعد</p>
        </div>
      </div>
    </div>
  )
}
