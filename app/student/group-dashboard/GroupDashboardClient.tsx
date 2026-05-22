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
  Users
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
  announcements
}: GroupDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'exams' | 'sessions' | 'attempts'>('exams')

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
      minute: '2-digit'
    })
  }

  // Calc some basic stats
  const completedExamsCount = attempts.length
  const totalScore = attempts.reduce((acc, a) => acc + (a.percentage || 0), 0)
  const avgScore = completedExamsCount > 0 ? Math.round(totalScore / completedExamsCount) : 0

  return (
    <div className="space-y-8 pb-24 md:pb-12 animate-fade-in" dir="rtl">
      {/* ── 🌟 STUNNING HEADER ─────────────────────────────────────────── */}
      <section className="relative rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl shadow-indigo-900/20 mb-8 group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-90" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[128px] opacity-25 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
          {/* Student Welcome & Profile info */}
          <div className="flex flex-col md:flex-row items-center text-center md:text-right gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl blur opacity-50" />
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.full_name}`}
                alt={profile.full_name}
                className="relative w-24 h-24 rounded-2xl border-2 border-white/20 object-cover shadow-2xl"
              />
            </div>
            <div className="text-white space-y-2">
              <div className="inline-flex items-center gap-1 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-indigo-300">
                <Users className="w-3.5 h-3.5" />
                طالب منتسب للمجموعة
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200">
                أهلاً، {profile.full_name.split(' ')[0]}!
              </h1>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                مرحباً بك في صفحتك المخصصة. هنا يمكنك الوصول لكافة واجباتك وحصصك المباشرة والمسجلة.
              </p>
            </div>
          </div>

          {/* Group Info Card */}
          <div className="w-full md:w-80 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-white space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">مجموعاتك المنضم إليها</h3>
            <div className="space-y-3">
              {studentGroups.length > 0 ? (
                studentGroups.map((sg: any) => (
                  <div key={sg.group_id} className="border-r-4 border-indigo-500 pr-3 py-1">
                    <p className="font-bold text-sm text-slate-100">{sg.student_groups?.name_ar}</p>
                    <p className="text-xs text-slate-400">المعلم: {sg.student_groups?.teachers?.profiles?.full_name || 'غير محدد'}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">غير منضم لأي مجموعة نشطة.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── VIP PROMOTIONAL CTA BANNER ─────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-orange-500/30 transition-shadow">
        <div className="absolute right-0 top-0 opacity-10 mix-blend-overlay">
          <Star className="w-64 h-64 -mr-16 -mt-16 animate-pulse" style={{ animationDuration: '3s' }} />
        </div>
        <div className="relative z-10 flex-1 text-center md:text-right">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-xs font-bold mb-3 shadow-sm">
            <Crown className="w-4 h-4 fill-yellow-300 text-yellow-300 animate-bounce" />
            باقة VIP المميزة من استباق
          </div>
          <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">افتح جميع قدرات المنصة!</h3>
          <p className="text-orange-50 text-sm opacity-95 max-w-lg leading-relaxed font-medium">
            اشترك الآن كطالب VIP واستمتع بتدريبات مخصصة بالذكاء الاصطناعي، مركز مراجعة الأخطاء التلقائي، تحديات الأصدقاء، لوحات الشرف، وتحليل مهارات بلوم التفصيلي!
          </p>
        </div>
        <div className="relative z-10 shrink-0 w-full md:w-auto">
          <Link
            href="/student/premium"
            className="flex items-center justify-center gap-2 w-full bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-orange-50 transition-all shadow-2xl hover:shadow-white/30 hover:scale-105 active:scale-95"
          >
            <Crown className="w-5 h-5 text-orange-600" />
            اشترك وافتح مميزات المنصة
          </Link>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left / Center: Tabs & Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex gap-2">
            {[
              { id: 'exams', label: 'الاختبارات والواجبات', icon: BookOpen },
              { id: 'sessions', label: 'الحصص والدروس', icon: Calendar },
              { id: 'attempts', label: 'نتائجي وتقاريري', icon: Award }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Contents */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm min-h-[300px]">
            {activeTab === 'exams' && (
              <div className="space-y-4">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  الاختبارات النشطة
                </h3>

                {exams.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {exams.map((exam) => {
                      const attempt = getExamAttempt(exam.id)
                      return (
                        <div
                          key={exam.id}
                          className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 hover:shadow-md transition-all group flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                {exam.student_groups?.name_ar}
                              </span>
                              {attempt ? (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> مكتمل
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
                                  بانتظارك
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                              {exam.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {exam.duration_minutes} دقيقة
                              </span>
                              <span className="flex items-center gap-1">
                                <ClipboardList className="w-3.5 h-3.5" />
                                {exam.questions_count} سؤال
                              </span>
                            </div>
                          </div>

                          <div className="mt-5">
                            {attempt ? (
                              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                                <span className="text-xs font-bold text-emerald-800">درجتك:</span>
                                <span className="font-black text-sm text-emerald-600">
                                  {Math.round(attempt.percentage)}%
                                </span>
                              </div>
                            ) : (
                              <Link
                                href={`/student/exams/${exam.id}/start`}
                                className="flex items-center justify-center gap-1.5 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                              >
                                ابدأ الاختبار الآن
                                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                              </Link>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-bold text-slate-600">لا توجد اختبارات متاحة حالياً.</p>
                    <p className="text-xs">سيقوم معلمك بنشر الاختبارات والواجبات هنا قريباً.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  حصص المجموعة المجدولة
                </h3>

                {sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                              {session.student_groups?.name_ar}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">
                              {formatDate(session.scheduled_at)}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-800">{session.title}</h4>

                          {session.media_title && (
                            <p className="text-xs text-indigo-600 font-medium">
                              📂 مرفق: {session.media_title}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                          {session.live_stream_url && (
                            <a
                              href={session.live_stream_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                            >
                              <Video className="w-4 h-4" />
                              دخول البث المباشر
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {session.media_url && (
                            <a
                              href={session.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors border border-slate-200"
                            >
                              عرض المرفقات
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-bold text-slate-600">لا توجد حصص مجدولة حالياً.</p>
                    <p className="text-xs">سيقوم معلمك بإضافة مواضيع الحصص والبث المباشر هنا.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-4">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-indigo-500" />
                  أرشيف النتائج
                </h3>

                {attempts.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {attempts.map((attempt) => (
                      <Link
                        key={attempt.id}
                        href={`/student/results/${attempt.id}`}
                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800">{attempt.exams?.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              أُنجز في {formatDate(attempt.completed_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`text-sm font-black ${
                              attempt.is_passed ? 'text-emerald-600' : 'text-rose-500'
                            }`}
                          >
                            {Math.round(attempt.percentage)}%
                          </span>
                          <ChevronLeft className="w-4 h-4 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <Award className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-bold text-slate-600">لا توجد نتائج مسجلة.</p>
                    <p className="text-xs">ابدأ بحل الاختبارات وسيتم عرض تقارير درجاتك هنا.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Quick Stats + Platform Announcements */}
        <div className="space-y-6">
          {/* Quick Stats Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">مستواك الحالي بالمجموعة</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-50 text-center">
                <p className="text-[10px] font-bold text-indigo-600">اختبارات مكتملة</p>
                <p className="text-3xl font-black text-indigo-900 mt-1">{completedExamsCount}</p>
              </div>
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-50 text-center">
                <p className="text-[10px] font-bold text-emerald-600">متوسط درجاتك</p>
                <p className="text-3xl font-black text-emerald-900 mt-1">{avgScore}%</p>
              </div>
            </div>
          </div>

          {/* Announcements Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">إعلانات المنصة والأنشطة</h3>
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
              <div className="bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                <p className="text-xs">لا توجد إعلانات نشطة حالياً.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
