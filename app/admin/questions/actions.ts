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

    const { error } = await supabase.from('questions').delete().in('id', ids)

    if (error) {
      console.error('Error bulk deleting questions:', error)
      return {
        success: false,
        error: 'حدث خطأ أثناء عملية الحذف في قاعدة البيانات.',
      }
    }

    revalidatePath('/admin/questions')
    return { success: true }
  } catch (error: any) {
    console.error('Bulk delete exception:', error)
    return {
      success: false,
      error: error.message || 'حدث خطأ غير متوقع أثناء الحذف.',
    }
  }
}

/**
 * Server Action لإنشاء مجموعة من الأسئلة المستوردة
 * @param questions مصفوفة من بيانات الأسئلة
 */
export async function bulkCreateQuestionsAction(questions: any[]) {
  if (!questions || questions.length === 0) {
    return { success: false, error: 'لم يتم توفير أي أسئلة للاستيراد.' }
  }

  try {
    await requireAdmin()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('غير مصرح')

    // جلب معرف الأدمن
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()
    if (!admin) throw new Error('فقط المديرون يمكنهم استيراد أسئلة')

    const questionsToInsert = questions.map((q) => ({
      admin_id: admin.id,
      subject_id: q.subject_id ? parseInt(q.subject_id, 10) : null,
      grade_id: q.grade_id ? parseInt(q.grade_id, 10) : null,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options || null,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      difficulty_level: q.difficulty_level || 'medium',
      bloom_level: q.bloom_level || 'understand',
      points: q.points || 1,
      status: 'approved',
      is_approved: true,
    }))

    const { error } = await supabase.from('questions').insert(questionsToInsert)

    if (error) {
      console.error('Error bulk inserting questions:', error)
      return {
        success: false,
        error: 'حدث خطأ أثناء حفظ الأسئلة في قاعدة البيانات: ' + error.message,
      }
    }

    revalidatePath('/admin/questions')
    return { success: true }
  } catch (error: any) {
    console.error('Bulk create exception:', error)
    return {
      success: false,
      error: error.message || 'حدث خطأ غير متوقع أثناء الاستيراد.',
    }
  }
}

