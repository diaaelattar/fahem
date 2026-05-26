import { Search, Home, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        {/* 404 visual */}
        <div className="relative mb-6">
          <div className="select-none text-8xl font-black text-slate-100">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="mb-2 text-xl font-bold text-slate-800">
          الصفحة غير موجودة
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها. لا تقلق، هذه الأشياء
          تحدث!
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/student/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            <BookOpen className="h-4 w-4" />
            لوحة الطالب
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
