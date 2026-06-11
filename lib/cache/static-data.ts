/**
 * Static Data Cache
 * يُخزّن البيانات الثابتة نسبياً (grades, subjects, semesters) باستخدام React cache
 * يمنع الاستعلام المتكرر عن نفس البيانات في كل طلب — تحسين Core Web Vitals
 */

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * جلب الصفوف الدراسية — مخزّنة مؤقتاً لمدة الطلب الواحد
 * تُجلب مرة واحدة فقط حتى لو استُدعيت من عدة مكونات في نفس الطلب
 */
export const getCachedGrades = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('grades')
    .select('id, name_ar, stage, order_num')
    .order('order_num', { ascending: true })
  return data ?? []
})

/**
 * جلب المواد الدراسية — مخزّنة مؤقتاً لمدة الطلب الواحد
 */
export const getCachedSubjects = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subjects')
    .select('id, name_ar, name_en, icon')
    .order('name_ar', { ascending: true })
  return data ?? []
})

/**
 * جلب الفصول الدراسية (Semesters) — مخزّنة مؤقتاً لمدة الطلب الواحد
 */
export const getCachedSemesters = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('semesters')
    .select('id, name_ar, number')
    .order('number', { ascending: true })
  return data ?? []
})
