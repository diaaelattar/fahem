'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

/**
 * Server Action لحذف مجموعة من الأسئلة
 * @param ids مصفوفة من معرفات الأسئلة المراد حذفها
 */
export async function bulkDeleteQuestionsAction(ids: string[]) {
  if (!ids || ids.length === 0) {
    return { success: false, error: 'لم يتم تحديد أي أسئلة.' }
  }

  try {
    // التأكد من صلاحيات الإدارة أولاً
    await requireAdmin()
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('questions')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Error bulk deleting questions:', error)
      return { success: false, error: 'حدث خطأ أثناء عملية الحذف في قاعدة البيانات.' }
    }

    revalidatePath('/admin/questions')
    return { success: true }
    
  } catch (error: any) {
    console.error('Bulk delete exception:', error)
    return { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء الحذف.' }
  }
}
