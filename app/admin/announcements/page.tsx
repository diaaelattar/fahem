import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import {
  deleteAnnouncementAction,
  toggleAnnouncementActiveAction,
} from './actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminAnnouncementsPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Fetch all announcements sorted by display_order, then created_at
  const { data: announcements } = await supabase
    .from('platform_announcements')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  // Inline toggle action for Server Components
  async function toggleStatus(id: string, currentStatus: boolean) {
    'use server'
    await toggleAnnouncementActiveAction(id, !currentStatus)
  }

  // Inline delete action for Server Components
  async function deleteAnn(id: string) {
    'use server'
    await deleteAnnouncementAction(id)
  }

  return (
    <div className="animate-fade-in space-y-6 text-right" dir="rtl">
      {/* Top Bar */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-800">
            <Megaphone className="h-6 w-6 text-primary" />
            إعلانات المنصة
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            إدارة وتخصيص الإعلانات المعروضة لطلاب المجموعات في لوحة التحكم
            الخاصة بهم.
          </p>
        </div>

        <Link
          href="/admin/announcements/new"
          className="flex items-center justify-center gap-2 self-stretch whitespace-nowrap rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary/10 transition-transform hover:scale-105 hover:bg-primary/90 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          إنشاء إعلان جديد
        </Link>
      </div>

      {/* List / Table of announcements */}
      {announcements && announcements.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500">
                  <th className="w-16 p-4 text-center">الترتيب</th>
                  <th className="p-4">الإعلان</th>
                  <th className="w-36 p-4">الإجراء المرفق (CTA)</th>
                  <th className="w-28 p-4 text-center">الحالة</th>
                  <th className="w-28 p-4 text-center">تاريخ الإنشاء</th>
                  <th className="w-32 p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {announcements.map((ann) => (
                  <tr
                    key={ann.id}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="p-4 text-center font-bold text-slate-500">
                      {ann.display_order}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        {ann.image_url ? (
                          <img
                            src={ann.image_url}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                            <Megaphone className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-md truncate font-bold text-slate-800">
                            {ann.title}
                          </p>
                          <p className="mt-1 line-clamp-1 max-w-md text-xs text-slate-500">
                            {ann.body}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-600">
                      {ann.cta_url ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-indigo-600">
                            {ann.cta_label || 'عرض'}
                          </p>
                          <p
                            className="max-w-[120px] truncate text-[10px] text-slate-400"
                            dir="ltr"
                          >
                            {ann.cta_url}
                          </p>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">لا يوجد</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <form
                        action={toggleStatus.bind(null, ann.id, ann.is_active)}
                      >
                        <button
                          type="submit"
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${
                            ann.is_active
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border border-rose-200 bg-rose-50 text-rose-700'
                          }`}
                        >
                          {ann.is_active ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              نشط
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              معطل
                            </>
                          )}
                        </button>
                      </form>
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-slate-400">
                      {new Date(ann.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/announcements/${ann.id}`}
                          className="rounded-xl bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100"
                          title="تعديل الإعلان"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <form
                          action={deleteAnn.bind(null, ann.id)}
                          onSubmit={(e) => {
                            if (
                              !confirm(
                                'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟'
                              )
                            ) {
                              e.preventDefault()
                            }
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-xl bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100"
                            title="حذف الإعلان"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
            <Megaphone className="h-7 w-7" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-slate-800">
            لا توجد إعلانات حالياً
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
            أنشئ أول إعلان للترويج لباقة VIP أو مشاركة الإشعارات والتنبيهات
            الهامة مع طلاب المجموعة.
          </p>
          <Link
            href="/admin/announcements/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary/10 transition-transform hover:scale-105 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            إنشاء أول إعلان
          </Link>
        </div>
      )}
    </div>
  )
}
