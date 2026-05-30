'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from './SidebarContext'
import {
  Brain,
  LayoutDashboard,
  Upload,
  HelpCircle,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  BookOpen,
  X,
  GraduationCap,
  Megaphone,
  School,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { href: '/admin/content', icon: Upload, label: 'رفع المحتوى' },
  { href: '/admin/questions', icon: HelpCircle, label: 'بنك الأسئلة' },
  { href: '/admin/questions/audit', icon: ShieldCheck, label: 'مركز التدقيق' },
  { href: '/admin/exams', icon: ClipboardList, label: 'الاختبارات' },
  { href: '/admin/students', icon: Users, label: 'الطلاب' },
  { href: '/admin/teachers', icon: GraduationCap, label: 'المعلمون' },
  { href: '/admin/schools', icon: School, label: 'المدارس' },
  { href: '/admin/announcements', icon: Megaphone, label: 'إعلانات المنصة' },
  { href: '/admin/reports', icon: BarChart3, label: 'التقارير' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()

  return (
    <>
      {/* ── Overlay (mobile only) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`fixed bottom-0 right-0 top-0 z-40 flex w-64 flex-col border-l border-border bg-white shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} `}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3"
            onClick={close}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-display text-base font-bold leading-none text-primary">
                استباق مصر
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                لوحة المدير
              </div>
            </div>
          </Link>
          {/* Close btn — visible on mobile only */}
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <div className="mt-1 px-3 py-2 text-xs font-semibold text-muted-foreground">
            القائمة الرئيسية
          </div>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href ||
              (href !== '/admin/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`sidebar-link ${active ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}

          <div className="mt-4 px-3 py-2 text-xs font-semibold text-muted-foreground">
            المناهج
          </div>
          <Link
            href="/admin/curriculum"
            onClick={close}
            className={`sidebar-link ${pathname.startsWith('/admin/curriculum') ? 'active' : ''}`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            هيكل المناهج
          </Link>
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-3">
          <Link
            href="/admin/settings"
            onClick={close}
            className={`sidebar-link ${pathname.startsWith('/admin/settings') ? 'active' : ''}`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            الإعدادات
          </Link>
        </div>
      </aside>
    </>
  )
}
