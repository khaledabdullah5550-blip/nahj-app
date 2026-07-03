import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500 font-bold text-white text-lg">
                ن
              </div>
              <span className="text-xl font-bold text-white">نهج</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                لوحة التحكم
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-gold-400/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-400">
              🇸🇦 مُطابق لمتطلبات هيئة السوق المالية (SAMA) ونظام PDPL
            </div>
            <h1 className="mb-6 text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              منصة{' '}
              <span className="bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent">
                نهج
              </span>
              <br />
              للخدمات المالية
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-brand-100">
              حلول مالية احترافية وآمنة مصممة خصيصاً للسوق السعودية، متوافقة
              مع أعلى معايير الأمن والامتثال التنظيمي.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/dashboard" className="btn-primary text-base px-8 py-4">
                ابدأ الآن
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-white/30 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-white/10"
              >
                اعرف أكثر
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-12 text-center text-3xl font-bold text-white">
              لماذا نهج؟
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 text-4xl">{feature.icon}</div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-brand-200 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Badges */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-2xl font-bold text-white">
              معايير الامتثال
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {badges.map((badge) => (
                <div
                  key={badge}
                  className="rounded-full border border-gold-400/40 bg-gold-500/10 px-6 py-2 text-sm font-semibold text-gold-400"
                >
                  ✅ {badge}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center">
        <p className="text-brand-300 text-sm">
          © {new Date().getFullYear()} نهج. جميع الحقوق محفوظة. |{' '}
          <span className="text-gold-400">منطقة الرياض - KSA</span>
        </p>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '🔒',
    title: 'أمان من الدرجة الأولى',
    description:
      'تشفير البيانات في حالة الراحة وأثناء النقل مع إدارة مفاتيح متقدمة عبر AWS KMS.',
  },
  {
    icon: '🇸🇦',
    title: 'البيانات داخل المملكة',
    description:
      'جميع البيانات محفوظة حصرياً في منطقة AWS الرياض (me-central-1) لضمان الامتثال لنظام PDPL.',
  },
  {
    icon: '📋',
    title: 'امتثال تنظيمي كامل',
    description:
      'متوافق مع متطلبات هيئة السوق المالية (SAMA) ونظام حماية البيانات الشخصية (PDPL).',
  },
  {
    icon: '📊',
    title: 'مراقبة ومتابعة',
    description:
      'سجلات تدقيق شاملة ومراقبة في الوقت الفعلي لجميع العمليات والأنشطة.',
  },
  {
    icon: '⚡',
    title: 'أداء عالي',
    description:
      'بنية تحتية قابلة للتوسع باستخدام AWS Lambda و DynamoDB لضمان أداء مستمر.',
  },
  {
    icon: '🛡️',
    title: 'حماية المستخدم',
    description:
      'ضوابط وصول دقيقة وإدارة صلاحيات متقدمة لحماية بيانات المستخدمين.',
  },
];

const badges = [
  'SAMA Compliant',
  'PDPL Compliant',
  'ISO 27001',
  'PCI DSS',
  'AWS KSA Region',
  'Data Residency KSA',
];
