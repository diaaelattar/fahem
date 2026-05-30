// lib/auth/permissions.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'school_admin' | 'student' | 'teacher'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

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
  if (profile.role === 'student') redirect('/student/dashboard')
  if (profile.role === 'teacher') redirect('/teacher/dashboard')
  if (profile.role !== 'admin') redirect('/auth/login')
  return profile
}

export async function requireStudent() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role === 'admin') redirect('/admin/dashboard')
  if (profile.role === 'teacher') redirect('/teacher/dashboard')
  if (profile.role !== 'student') redirect('/auth/login')
  return profile
}

export async function requireTeacher() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/login')
  if (profile.role === 'admin') redirect('/admin/dashboard')
  if (profile.role === 'student') redirect('/student/dashboard')
  if (profile.role !== 'teacher') redirect('/auth/login')
  return profile
}

export async function requireSchoolAdmin() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/school/login')
  if (profile.role === 'student') redirect('/student/dashboard')
  if (profile.role === 'teacher') redirect('/teacher/dashboard')
  if (profile.role !== 'school_admin' && profile.role !== 'admin') redirect('/auth/school/login')
  return profile
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const adminRoutes = ['/admin']
  const studentRoutes = ['/student']
  const teacherRoutes = ['/teacher']

  if (adminRoutes.some((r) => path.startsWith(r))) {
    return role === 'admin'
  }
  if (studentRoutes.some((r) => path.startsWith(r))) {
    return role === 'student'
  }
  if (teacherRoutes.some((r) => path.startsWith(r))) {
    return role === 'teacher'
  }
  return true
}
