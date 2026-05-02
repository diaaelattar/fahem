import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="text-center px-6">
        <div className="text-8xl font-display font-bold text-primary/20 mb-4">٤٠٤</div>
        <h1 className="text-2xl font-display font-bold mb-2">الصفحة غير موجودة</h1>
        <p className="text-muted-foreground text-sm mb-8">
          الرابط الذي تبحث عنه غير موجود أو تم نقله
        </p>
        <Link href="/"
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors inline-block">
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  )
}
