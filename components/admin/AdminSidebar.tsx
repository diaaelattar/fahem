'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const MENU_SECTIONS = [
  {
    label: 'الرئيسية',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    ],
  },
  {
    label: 'إدارة المحتوى',
    items: [
      { href: '/admin/content', icon: Upload, label: 'رفع المحتوى' },
      { href: '/admin/questions', icon: HelpCircle, label: 'بنك الأسئلة' },
      { href: '/admin/questions/audit', icon: ShieldCheck, label: 'مركز التدقيق', badge: 'جديد', badgeClass: 'bg-indigo-500 text-white' },
      { href: '/admin/exams', icon: ClipboardList, label: 'الاختبارات' },
      { href: '/admin/curriculum', icon: BookOpen, label: 'هيكل المناهج' },
    ],
  },
  {
    label: 'المستخدمون والجهات',
    items: [
      { href: '/admin/students', icon: Users, label: 'الطلاب' },
      { href: '/admin/teachers', icon: GraduationCap, label: 'المعلمون' },
      { href: '/admin/schools', icon: School, label: 'المدارس' },
    ],
  },
  {
    label: 'النظام والتقارير',
    items: [
      { href: '/admin/announcements', icon: Megaphone, label: 'إعلانات المنصة' },
      { href: '/admin/reports', icon: BarChart3, label: 'التقارير' },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()

  const isActive = (href: string) =>
    href === '/admin/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(href)

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold focus:text-sm"
      >
        تخطى للمحتوى الرئيسي
      </a>

      {/* ── Overlay (mobile only) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        role="navigation"
        aria-label="قائمة التنقل للمدير العام"
        className={`fixed bottom-0 right-0 top-0 z-40 flex w-64 flex-col border-l border-slate-100 bg-white/95 backdrop-blur-md shadow-xl transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } `}
      >
        {/* Logo row */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 transition-opacity hover:opacity-85"
            onClick={close}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-700 shadow-md">
              <Brain className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="font-display text-[15px] font-black text-slate-800 leading-none">
                استباق مصر
              </div>
              <div className="mt-1 text-[11px] font-bold text-slate-400">
                لوحة المدير العام
              </div>
            </div>
          </Link>
          {/* Close btn — visible on mobile only */}
          <button
            onClick={close}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:hidden transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {MENU_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                {section.label}
              </p>

              <div className="space-y-0.5">
                {section.items.map(({ href, icon: Icon, label, badge, badgeClass }) => {
                  const active = isActive(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-200 ${
                        active
                          ? 'bg-primary/5 text-primary font-black shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      {active && (
                        <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-primary" />
                      )}

                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>

                      <span className="flex-1">{label}</span>

                      {badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black ${badgeClass}`}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-100 p-3">
          <Link
            href="/admin/settings"
            onClick={close}
            aria-current={isActive('/admin/settings') ? 'page' : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-200 ${
              isActive('/admin/settings')
                ? 'bg-primary/5 text-primary font-black'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {isActive('/admin/settings') && (
              <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-primary" />
            )}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                isActive('/admin/settings')
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
              }`}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="flex-1">الإعدادات النظام</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
