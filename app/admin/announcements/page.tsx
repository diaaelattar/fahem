import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { Megaphone, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { deleteAnnouncementAction, toggleAnnouncementActiveAction } from './actions'

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
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            إعلانات المنصة
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            إدارة وتخصيص الإعلانات المعروضة لطلاب المجموعات في لوحة التحكم الخاصة بهم.
          </p>
        </div>

        <Link
          href="/admin/announcements/new"
          className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-primary/10 text-sm whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          إنشاء إعلان جديد
        </Link>
      </div>

      {/* List / Table of announcements */}
      {announcements && announcements.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                  <th className="p-4 w-16 text-center">الترتيب</th>
                  <th className="p-4">الإعلان</th>
                  <th className="p-4 w-36">الإجراء المرفق (CTA)</th>
                  <th className="p-4 w-28 text-center">الحالة</th>
                  <th className="p-4 w-28 text-center">تاريخ الإنشاء</th>
                  <th className="p-4 w-32 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center font-bold text-slate-500">{ann.display_order}</td>
                    <td className="p-4">
                      <div className="flex gap-4 items-center">
                        {ann.image_url ? (
                          <img
                            src={ann.image_url}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                            <Megaphone className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate max-w-md">{ann.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-md mt-1">{ann.body}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-600">
                      {ann.cta_url ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-indigo-600">{ann.cta_label || 'عرض'}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[120px]" dir="ltr">{ann.cta_url}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">لا يوجد</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <form action={toggleStatus.bind(null, ann.id, ann.is_active)}>
                        <button
                          type="submit"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${
                            ann.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ann.is_active ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              نشط
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              معطل
                            </>
                          )}
                        </button>
                      </form>
                    </td>
                    <td className="p-4 text-center text-xs text-slate-400 font-bold">
                      {new Date(ann.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/announcements/${ann.id}`}
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors"
                          title="تعديل الإعلان"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <form action={deleteAnn.bind(null, ann.id)} onSubmit={(e) => {
                          if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟')) {
                            e.preventDefault();
                          }
                        }}>
                          <button
                            type="submit"
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                            title="حذف الإعلان"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Megaphone className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">لا توجد إعلانات حالياً</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            أنشئ أول إعلان للترويج لباقة VIP أو مشاركة الإشعارات والتنبيهات الهامة مع طلاب المجموعة.
          </p>
          <Link
            href="/admin/announcements/new"
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-primary/10 text-sm"
          >
            <Plus className="w-4 h-4" />
            إنشاء أول إعلان
          </Link>
        </div>
      )}
    </div>
  )
}
