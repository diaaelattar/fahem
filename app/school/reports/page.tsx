import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  FileText,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Download,
  Users
} from 'lucide-react'
import { SchoolReportsClient } from '@/components/school/SchoolReportsClient'

export const dynamic = 'force-dynamic'

export default async function SchoolReportsPage() {
  const profile = await getCurrentProfile()

  if (!profile || (profile.role !== 'school_admin' && profile.role !== 'admin')) {
    redirect('/auth/school/login')
  }

  const schoolId = profile.school_id
  if (!schoolId) {
    redirect('/school/dashboard')
  }

  const supabase = await createClient()

  // جلب جميع محاولات الطلاب مع بيانات الطالب والامتحان
  const { data: attemptsRaw } = await supabase
    .from('exam_attempts')
    .select(`
      id,
      score,
      percentage,
      is_passed,
      created_at,
      student_id,
      exams!inner(school_id, title, total_points, subject_id),
      profiles!student_id(full_name, email)
    `)
    .eq('exams.school_id', schoolId)
    .order('created_at', { ascending: false })

  const attempts = attemptsRaw || []

  // جلب المواد لربط الأسماء
  const { data: subjectsRaw } = await supabase
    .from('subjects')
    .select('id, name_ar')

  const subjects = subjectsRaw || []
  const subjectMap = new Map<number, string>()
  subjects.forEach((s) => subjectMap.set(s.id, s.name_ar))

  // حساب مؤشرات الأداء الأساسية (KPIs)
  const totalAttempts = attempts.length
  const passedAttempts = attempts.filter((a) => a.is_passed).length
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0

  const totalPercentage = attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0)
  const averagePercentage = totalAttempts > 0 ? Math.round(totalPercentage / totalAttempts) : 0

  // تجميع أداء كل طالب
  const studentPerformanceMap = new Map<string, {
    name: string
    email: string
    totalAttempts: number
    passedAttempts: number
    avgPercentage: number
  }>()

  attempts.forEach((a) => {
    const profile = a.profiles as any
    const studentId = a.student_id
    if (!studentId) return

    const existing = studentPerformanceMap.get(studentId)
    if (existing) {
      existing.totalAttempts += 1
      existing.passedAttempts += a.is_passed ? 1 : 0
      existing.avgPercentage = Math.round(
        (existing.avgPercentage * (existing.totalAttempts - 1) + Number(a.percentage || 0)) / existing.totalAttempts
      )
    } else {
      studentPerformanceMap.set(studentId, {
        name: profile?.full_name || 'طالب',
        email: profile?.email || '',
        totalAttempts: 1,
        passedAttempts: a.is_passed ? 1 : 0,
        avgPercentage: Math.round(Number(a.percentage || 0))
      })
    }
  })

  const studentPerformance = Array.from(studentPerformanceMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.avgPercentage - a.avgPercentage)

  // تجميع أداء كل امتحان
  const examPerformanceMap = new Map<string, {
    title: string
    totalAttempts: number
    passedAttempts: number
    avgPercentage: number
  }>()

  attempts.forEach((a) => {
    const exam = a.exams as any
    const title = exam?.title || 'امتحان'
    const existing = examPerformanceMap.get(title)
    if (existing) {
      existing.totalAttempts += 1
      existing.passedAttempts += a.is_passed ? 1 : 0
      existing.avgPercentage = Math.round(
        (existing.avgPercentage * (existing.totalAttempts - 1) + Number(a.percentage || 0)) / existing.totalAttempts
      )
    } else {
      examPerformanceMap.set(title, {
        title,
        totalAttempts: 1,
        passedAttempts: a.is_passed ? 1 : 0,
        avgPercentage: Math.round(Number(a.percentage || 0))
      })
    }
  })

  const examPerformance = Array.from(examPerformanceMap.values())
    .sort((a, b) => b.totalAttempts - a.totalAttempts)

  return (
    <SchoolReportsClient
      totalAttempts={totalAttempts}
      passRate={passRate}
      averagePercentage={averagePercentage}
      studentPerformance={studentPerformance}
      examPerformance={examPerformance}
    />
  )
}
