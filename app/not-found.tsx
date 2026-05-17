import { Search, Home, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* 404 visual */}
        <div className="relative mb-6">
          <div className="text-8xl font-black text-slate-100 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-800 mb-2">الصفحة غير موجودة</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها. لا تقلق، هذه الأشياء تحدث!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/student/dashboard"
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            لوحة الطالب
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
