'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from './SidebarContext'
import {
  Brain, LayoutDashboard, Upload, HelpCircle, ShieldCheck,
  ClipboardList, BarChart3, Users, Settings, BookOpen, X, GraduationCap
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/admin/content',   icon: Upload,          label: 'رفع المحتوى' },
  { href: '/admin/questions',       icon: HelpCircle,       label: 'بنك الأسئلة' },
  { href: '/admin/questions/audit', icon: ShieldCheck,       label: 'مركز التدقيق' },
  { href: '/admin/exams',           icon: ClipboardList,    label: 'الاختبارات' },
  { href: '/admin/students',  icon: Users,            label: 'الطلاب' },
  { href: '/admin/teachers',  icon: GraduationCap,    label: 'المعلمون' },
  { href: '/admin/reports',   icon: BarChart3,        label: 'التقارير' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()

  return (
    <>
      {/* ── Overlay (mobile only) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`
          fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-border
          flex flex-col shadow-xl z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo row */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={close}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-base text-primary leading-none">استباق مصر</div>
              <div className="text-xs text-muted-foreground mt-0.5">لوحة المدير</div>
            </div>
          </Link>
          {/* Close btn — visible on mobile only */}
          <button
            onClick={close}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-1">القائمة الرئيسية</div>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}

          <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-4">المناهج</div>
          <Link
            href="/admin/curriculum"
            onClick={close}
            className={`sidebar-link ${pathname.startsWith('/admin/curriculum') ? 'active' : ''}`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            هيكل المناهج
          </Link>
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-border">
          <Link
            href="/admin/settings"
            onClick={close}
            className={`sidebar-link ${pathname.startsWith('/admin/settings') ? 'active' : ''}`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            الإعدادات
          </Link>
        </div>
      </aside>
    </>
  )
}
