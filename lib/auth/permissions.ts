// lib/auth/permissions.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'student'

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getCurrentProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  return user
}

export async function requireAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'admin') redirect('/student/dashboard')
  return profile
}

export async function requireStudent() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role !== 'student') redirect('/admin/dashboard')
  return profile
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const adminRoutes = ['/admin']
  const studentRoutes = ['/student']

  if (adminRoutes.some(r => path.startsWith(r))) {
    return role === 'admin'
  }
  if (studentRoutes.some(r => path.startsWith(r))) {
    return role === 'student'
  }
  return true
}
