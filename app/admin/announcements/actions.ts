'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

export async function createAnnouncementAction(formData: {
  title: string
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  imageUrl?: string | null
  isActive?: boolean
  displayOrder?: number
}) {
  await requireAdmin()
  const supabase = createClient()

  if (!formData.title.trim()) throw new Error('العنوان مطلوب')
  if (!formData.body.trim()) throw new Error('محتوى الإعلان مطلوب')

  const { error } = await supabase.from('platform_announcements').insert({
    title: formData.title,
    body: formData.body,
    cta_label: formData.ctaLabel || null,
    cta_url: formData.ctaUrl || null,
    image_url: formData.imageUrl || null,
    is_active: formData.isActive ?? true,
    display_order: formData.displayOrder ?? 0
  })

  if (error) {
    throw new Error(`فشل إنشاء الإعلان: ${error.message}`)
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/student/group-dashboard')
  return { success: true }
}

export async function updateAnnouncementAction(
  id: string,
  formData: {
    title: string
    body: string
    ctaLabel?: string | null
    ctaUrl?: string | null
    imageUrl?: string | null
    isActive?: boolean
    displayOrder?: number
  }
) {
  await requireAdmin()
  const supabase = createClient()

  if (!formData.title.trim()) throw new Error('العنوان مطلوب')
  if (!formData.body.trim()) throw new Error('محتوى الإعلان مطلوب')

  const { error } = await supabase
    .from('platform_announcements')
    .update({
      title: formData.title,
      body: formData.body,
      cta_label: formData.ctaLabel || null,
      cta_url: formData.ctaUrl || null,
      image_url: formData.imageUrl || null,
      is_active: formData.isActive ?? true,
      display_order: formData.displayOrder ?? 0
    })
    .eq('id', id)

  if (error) {
    throw new Error(`فشل تعديل الإعلان: ${error.message}`)
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/student/group-dashboard')
  return { success: true }
}

export async function deleteAnnouncementAction(id: string) {
  await requireAdmin()
  const supabase = createClient()

  const { error } = await supabase
    .from('platform_announcements')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`فشل حذف الإعلان: ${error.message}`)
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/student/group-dashboard')
  return { success: true }
}

export async function toggleAnnouncementActiveAction(id: string, isActive: boolean) {
  await requireAdmin()
  const supabase = createClient()

  const { error } = await supabase
    .from('platform_announcements')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    throw new Error(`فشل تحديث حالة الإعلان: ${error.message}`)
  }

  revalidatePath('/admin/announcements')
  revalidatePath('/student/group-dashboard')
  return { success: true }
}
