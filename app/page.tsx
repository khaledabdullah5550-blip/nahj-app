import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-nahj-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-nahj-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ن</span>
              </div>
              <span className="text-white font-bold text-xl">نهج</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="bg-nahj-500 hover:bg-nahj-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                لوحة التحكم
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-nahj-500/20 border border-nahj-500/30 text-nahj-300 px-4 py-2 rounded-full text-sm mb-6">
            <span>✅</span>
            <span>متوافق مع PDPL و SAMA</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            منصة{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nahj-400 to-gold-400">
              نهج
            </span>
            <br />
            للإدارة المالية
          </h1>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            منصة مالية احترافية آمنة، مبنية على AWS Riyadh Region، متوافقة مع قوانين البيانات
            الشخصية السعودية (PDPL) ومتطلبات سامة (SAMA).
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto bg-nahj-500 hover:bg-nahj-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-nahj-500/25"
            >
              ابدأ الآن مجاناً
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-xl font-medium text-lg transition-all duration-200 hover:bg-white/10"
            >
              اعرف أكثر
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: 'تكلفة شهرية', value: '$0-30', sub: 'بيئة تجريبية' },
            { label: 'منطقة AWS', value: 'الرياض', sub: 'me-central-1' },
            { label: 'وقت الاستجابة', value: '<100ms', sub: 'Serverless' },
            { label: 'Uptime', value: '99.9%', sub: 'SLA مضمون' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors"
            >
              <div className="text-3xl font-bold text-nahj-400 mb-1">{stat.value}</div>
              <div className="text-white font-medium text-sm">{stat.label}</div>
              <div className="text-slate-400 text-xs mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          المميزات الأساسية
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: '🔐',
              title: 'أمان عالي',
              desc: 'تشفير كامل للبيانات في وضع الراحة والنقل مع دعم AWS KMS',
            },
            {
              icon: '📍',
              title: 'بيانات في السعودية',
              desc: 'كل البيانات تُخزن في منطقة الرياض (me-central-1) فقط',
            },
            {
              icon: '✅',
              title: 'PDPL متوافق',
              desc: 'متوافق مع نظام حماية البيانات الشخصية السعودي بالكامل',
            },
            {
              icon: '🏦',
              title: 'SAMA متوافق',
              desc: 'يستوفي متطلبات البنك المركزي السعودي للأمان المالي',
            },
            {
              icon: '⚡',
              title: 'Serverless سريع',
              desc: 'AWS Lambda مع Auto-scaling تلقائي وتكلفة حسب الاستخدام',
            },
            {
              icon: '📊',
              title: 'تحليلات متقدمة',
              desc: 'لوحة تحكم شاملة مع تقارير مالية وإحصاءات فورية',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 hover:border-nahj-500/30 group"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-nahj-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
        <h2 className="text-2xl font-bold text-white text-center mb-8">الامتثال والأمان</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            'PDPL Compliant',
            'SAMA Compliant',
            'AWS KMS Encryption',
            'Data Residency KSA',
            'Audit Logging',
            'HTTPS/TLS 1.3',
            'Zero-Trust Security',
          ].map((badge) => (
            <div
              key={badge}
              className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-medium"
            >
              ✓ {badge}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400 text-sm">
            © 2024 نهج - منصة الإدارة المالية | جميع البيانات محفوظة في السعودية
          </p>
        </div>
      </footer>
    </main>
  );
}
