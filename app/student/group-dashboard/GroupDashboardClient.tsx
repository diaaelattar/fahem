'use client'

import { useState } from 'react'
import {
  BookOpen,
  Calendar,
  Clock,
  ClipboardList,
  Award,
  Video,
  FileText,
  User,
  ArrowLeft,
  Crown,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  Trophy,
  Flame,
  Star,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import PlatformAnnouncement from '@/components/announcements/PlatformAnnouncement'

interface GroupDashboardClientProps {
  profile: {
    full_name: string
    avatar_url?: string | null
  }
  studentGroups: any[]
  exams: any[]
  sessions: any[]
  attempts: any[]
  announcements: any[]
}

export default function GroupDashboardClient({
  profile,
  studentGroups,
  exams,
  sessions,
  attempts,
  announcements,
}: GroupDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'exams' | 'sessions' | 'attempts'>(
    'exams'
  )

  // Find attempt for an exam
  const getExamAttempt = (examId: string) => {
    return attempts.find((a) => a.exam_id === examId)
  }

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calc some basic stats
  const completedExamsCount = attempts.length
  const totalScore = attempts.reduce((acc, a) => acc + (a.percentage || 0), 0)
  const avgScore =
    completedExamsCount > 0 ? Math.round(totalScore / completedExamsCount) : 0

  return (
    <div className="animate-fade-in space-y-8 pb-24 md:pb-12" dir="rtl">
      {/* ── 🌟 STUNNING HEADER ─────────────────────────────────────────── */}
      <section className="group relative mb-8 overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl shadow-indigo-900/20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-90" />
        <div className="absolute right-0 top-0 h-96 w-96 animate-pulse rounded-full bg-indigo-500 opacity-25 mix-blend-screen blur-[128px] filter" />
        <div
          className="absolute bottom-0 left-0 h-96 w-96 animate-pulse rounded-full bg-fuchsia-500 opacity-20 mix-blend-screen blur-[128px] filter"
          style={{ animationDuration: '6s' }}
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

        <div className="relative flex flex-col items-center justify-between gap-6 p-8 backdrop-blur-sm md:flex-row md:p-12">
          {/* Student Welcome & Profile info */}
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-right">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 opacity-50 blur" />
              <img
                src={
                  profile.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`
                }
                alt={profile.full_name}
                className="relative h-24 w-24 rounded-2xl border-2 border-white/20 object-cover shadow-2xl"
              />
            </div>
            <div className="space-y-2 text-white">
              <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-indigo-300">
                <Users className="h-3.5 w-3.5" />
                طالب منتسب للمجموعة
              </div>
              <h1 className="bg-gradient-to-b from-white to-slate-200 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
                أهلاً، {profile.full_name.split(' ')[0]}!
              </h1>
              <p className="text-sm font-medium leading-relaxed text-slate-400">
                مرحباً بك في صفحتك المخصصة. هنا يمكنك الوصول لكافة واجباتك وحصصك
                المباشرة والمسجلة.
              </p>
            </div>
          </div>

          {/* Group Info Card */}
          <div className="w-full space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white backdrop-blur-xl md:w-80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              مجموعاتك المنضم إليها
            </h3>
            <div className="space-y-3">
              {studentGroups.length > 0 ? (
                studentGroups.map((sg: any) => (
                  <div
                    key={sg.group_id}
                    className="border-r-4 border-indigo-500 py-1 pr-3"
                  >
                    <p className="text-sm font-bold text-slate-100">
                      {sg.student_groups?.name_ar}
                    </p>
                    <p className="text-xs text-slate-400">
                      المعلم:{' '}
                      {sg.student_groups?.teachers?.profiles?.full_name ||
                        'غير محدد'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs italic text-slate-400">
                  غير منضم لأي مجموعة نشطة.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── VIP PROMOTIONAL CTA BANNER ─────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl shadow-orange-500/20 transition-shadow hover:shadow-orange-500/30 md:flex-row">
        <div className="absolute right-0 top-0 opacity-10 mix-blend-overlay">
          <Star
            className="-mr-16 -mt-16 h-64 w-64 animate-pulse"
            style={{ animationDuration: '3s' }}
          />
        </div>
        <div className="relative z-10 flex-1 text-center md:text-right">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-xs font-bold shadow-sm backdrop-blur-sm">
            <Crown className="h-4 w-4 animate-bounce fill-yellow-300 text-yellow-300" />
            باقة VIP المميزة من استباق
          </div>
          <h3 className="mb-2 text-2xl font-black tracking-tight md:text-3xl">
            افتح جميع قدرات المنصة!
          </h3>
          <p className="max-w-lg text-sm font-medium leading-relaxed text-orange-50 opacity-95">
            اشترك الآن كطالب VIP واستمتع بتدريبات مخصصة بالذكاء الاصطناعي، مركز
            مراجعة الأخطاء التلقائي، تحديات الأصدقاء، لوحات الشرف، وتحليل مهارات
            بلوم التفصيلي!
          </p>
        </div>
        <div className="relative z-10 w-full shrink-0 md:w-auto">
          <Link
            href="/student/premium"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-orange-600 shadow-2xl transition-all hover:scale-105 hover:bg-orange-50 hover:shadow-white/30 active:scale-95"
          >
            <Crown className="h-5 w-5 text-orange-600" />
            اشترك وافتح مميزات المنصة
          </Link>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left / Center: Tabs & Lists */}
        <div className="space-y-6 lg:col-span-2">
          {/* Navigation Tabs */}
          <div className="flex gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
            {[
              { id: 'exams', label: 'الاختبارات والواجبات', icon: BookOpen },
              { id: 'sessions', label: 'الحصص والدروس', icon: Calendar },
              { id: 'attempts', label: 'نتائجي وتقاريري', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all md:text-sm ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Contents */}
          <div className="min-h-[300px] rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            {activeTab === 'exams' && (
              <div className="space-y-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-800">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  الاختبارات النشطة
                </h3>

                {exams.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {exams.map((exam) => {
                      const attempt = getExamAttempt(exam.id)
                      return (
                        <div
                          key={exam.id}
                          className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition-all hover:border-indigo-200 hover:shadow-md"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                {exam.student_groups?.name_ar}
                              </span>
                              {attempt ? (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                  <CheckCircle className="h-3 w-3" /> مكتمل
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                  بانتظارك
                                </span>
                              )}
                            </div>
                            <h4 className="line-clamp-2 text-sm font-bold text-slate-800 transition-colors group-hover:text-indigo-600">
                              {exam.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {exam.duration_minutes} دقيقة
                              </span>
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3.5 w-3.5" />
                                {exam.questions_count} سؤال
                              </span>
                            </div>
                          </div>

                          <div className="mt-5">
                            {attempt ? (
                              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-2.5">
                                <span className="text-xs font-bold text-emerald-800">
                                  درجتك:
                                </span>
                                <span className="text-sm font-black text-emerald-600">
                                  {Math.round(attempt.percentage)}%
                                </span>
                              </div>
                            ) : (
                              <Link
                                href={`/student/exams/${exam.id}/start`}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
                              >
                                ابدأ الاختبار الآن
                                <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                    <p className="font-bold text-slate-600">
                      لا توجد اختبارات متاحة حالياً.
                    </p>
                    <p className="text-xs">
                      سيقوم معلمك بنشر الاختبارات والواجبات هنا قريباً.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-800">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  حصص المجموعة المجدولة
                </h3>

                {sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 md:flex-row md:items-center"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              {session.student_groups?.name_ar}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {formatDate(session.scheduled_at)}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {session.title}
                          </h4>

                          {session.media_title && (
                            <p className="text-xs font-medium text-indigo-600">
                              📂 مرفق: {session.media_title}
                            </p>
                          )}
                        </div>

                        <div className="flex w-full gap-2 md:w-auto">
                          {session.live_stream_url && (
                            <a
                              href={session.live_stream_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 md:flex-none"
                            >
                              <Video className="h-4 w-4" />
                              دخول البث المباشر
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {session.media_url && (
                            <a
                              href={session.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 md:flex-none"
                            >
                              عرض المرفقات
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                    <p className="font-bold text-slate-600">
                      لا توجد حصص مجدولة حالياً.
                    </p>
                    <p className="text-xs">
                      سيقوم معلمك بإضافة مواضيع الحصص والبث المباشر هنا.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-4">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-800">
                  <Award className="h-5 w-5 text-indigo-500" />
                  أرشيف النتائج
                </h3>

                {attempts.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {attempts.map((attempt) => (
                      <Link
                        key={attempt.id}
                        href={`/student/results/${attempt.id}`}
                        className="flex items-center justify-between rounded-xl p-4 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {attempt.exams?.title}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                              أُنجز في {formatDate(attempt.completed_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`text-sm font-black ${
                              attempt.is_passed
                                ? 'text-emerald-600'
                                : 'text-rose-500'
                            }`}
                          >
                            {Math.round(attempt.percentage)}%
                          </span>
                          <ChevronLeft className="h-4 w-4 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    <Award className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                    <p className="font-bold text-slate-600">
                      لا توجد نتائج مسجلة.
                    </p>
                    <p className="text-xs">
                      ابدأ بحل الاختبارات وسيتم عرض تقارير درجاتك هنا.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Quick Stats + Platform Announcements */}
        <div className="space-y-6">
          {/* Quick Stats Panel */}
          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">
              مستواك الحالي بالمجموعة
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-indigo-50 bg-indigo-50/50 p-4 text-center">
                <p className="text-[10px] font-bold text-indigo-600">
                  اختبارات مكتملة
                </p>
                <p className="mt-1 text-3xl font-black text-indigo-900">
                  {completedExamsCount}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-50 bg-emerald-50/50 p-4 text-center">
                <p className="text-[10px] font-bold text-emerald-600">
                  متوسط درجاتك
                </p>
                <p className="mt-1 text-3xl font-black text-emerald-900">
                  {avgScore}%
                </p>
              </div>
            </div>
          </div>

          {/* Announcements Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                إعلانات المنصة والأنشطة
              </h3>
            </div>

            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((ad) => (
                  <PlatformAnnouncement
                    key={ad.id}
                    id={ad.id}
                    title={ad.title}
                    body={ad.body}
                    ctaLabel={ad.cta_label}
                    ctaUrl={ad.cta_url}
                    imageUrl={ad.image_url}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-slate-400">
                <p className="text-xs">لا توجد إعلانات نشطة حالياً.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
