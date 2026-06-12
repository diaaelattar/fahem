'use client'

export {}

import { useState, useRef } from 'react'
import {
  createSessionAction,
  deleteSessionAction,
  saveAttendanceAction,
} from './actions'
import {
  Calendar,
  Plus,
  X,
  Loader2,
  ExternalLink,
  Paperclip,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Video,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Session {
  id: string
  title: string
  scheduled_at: string
  live_stream_url: string | null
  media_url: string | null
  media_title: string | null
  created_at: string
}

interface GroupStudent {
  id: string
  student_id: string
  students: {
    id: string
    profiles: {
      full_name: string | null
      email: string | null
      avatar_url: string | null
    } | null
  } | null
}

type AttendanceStatus = 'present' | 'absent' | 'late'

export function SessionsTab({
  groupId,
  sessions: initialSessions,
  groupStudents,
}: {
  groupId: string
  sessions: Session[]
  groupStudents: GroupStudent[]
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [showNewSession, setShowNewSession] = useState(false)
  const [loadingNew, setLoadingNew] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [attendanceSession, setAttendanceSession] = useState<Session | null>(
    null
  )
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({})
  const [savingAttendance, setSavingAttendance] = useState(false)

  const [confirmData, setConfirmData] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)
  const confirmModalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(confirmModalRef, !!confirmData, () => setConfirmData(null))

  // New Session Form State
  const [newTitle, setNewTitle] = useState('')
  const [newDateTime, setNewDateTime] = useState('')
  const [newLiveUrl, setNewLiveUrl] = useState('')
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [newMediaTitle, setNewMediaTitle] = useState('')

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newDateTime) return
    setLoadingNew(true)
    try {
      await createSessionAction(groupId, {
        title: newTitle,
        scheduledAt: newDateTime,
        liveStreamUrl: newLiveUrl || undefined,
        mediaUrl: newMediaUrl || undefined,
        mediaTitle: newMediaTitle || undefined,
      })
      toast.success('تم جدولة الحصة بنجاح')
      // Refresh locally (page will revalidate)
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingNew(false)
    }
  }

  async function handleDeleteSession(sessionId: string) {
    setConfirmData({
      message: 'هل تريد حذف هذه الحصة؟',
      onConfirm: async () => {
        setDeletingId(sessionId)
        try {
          await deleteSessionAction(sessionId, groupId)
          setSessions((prev) => prev.filter((s) => s.id !== sessionId))
          toast.success('تم حذف الحصة')
        } catch (err: any) {
          toast.error(err.message)
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  function openAttendance(session: Session) {
    setAttendanceSession(session)
    // Default all to 'present'
    const defaults: Record<string, AttendanceStatus> = {}
    groupStudents.forEach((gs) => {
      defaults[gs.student_id] = 'present'
    })
    setAttendanceMap(defaults)
  }

  async function handleSaveAttendance() {
    if (!attendanceSession) return
    setSavingAttendance(true)
    try {
      const data = groupStudents.map((gs) => ({
        studentId: gs.student_id,
        status: attendanceMap[gs.student_id] || 'absent',
      }))
      await saveAttendanceAction(attendanceSession.id, groupId, data)
      toast.success('تم حفظ الحضور بنجاح')
      setAttendanceSession(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingAttendance(false)
    }
  }

  const upcoming = sessions
    .filter((s) => new Date(s.scheduled_at) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )
  const past = sessions
    .filter((s) => new Date(s.scheduled_at) < new Date())
    .sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    )

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Calendar className="h-5 w-5 text-violet-500" />
          الحصص والمواعيد ({sessions.length})
        </h2>
        <button
          onClick={() => setShowNewSession(true)}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-50"
        >
          <Plus className="h-4 w-4" /> جدولة حصة جديدة
        </button>
      </div>

      {/* Sessions List */}
      <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-200" />
            <p className="mb-1 font-bold">لا توجد حصص مجدولة بعد</p>
            <p className="text-sm">اضغط "جدولة حصة جديدة" لإضافة موعدك الأول</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  قادمة
                </p>
                {upcoming.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onDelete={() => handleDeleteSession(session.id)}
                    onAttendance={() => openAttendance(session)}
                    isDeleting={deletingId === session.id}
                    hasStudents={groupStudents.length > 0}
                  />
                ))}
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  سابقة
                </p>
                {past.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onDelete={() => handleDeleteSession(session.id)}
                    onAttendance={() => openAttendance(session)}
                    isDeleting={deletingId === session.id}
                    hasStudents={groupStudents.length > 0}
                    isPast
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Session Modal */}
      {showNewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-l from-violet-50 to-white p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold text-violet-700">
                <Calendar className="h-5 w-5" /> جدولة حصة جديدة
              </h3>
              <button
                onClick={() => setShowNewSession(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  عنوان الحصة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: مراجعة الفصل الثالث"
                  className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors focus:border-violet-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  التاريخ والوقت <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors focus:border-violet-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">
                  <Video className="ml-1 inline h-4 w-4 text-violet-500" />
                  رابط البث المباشر (Zoom / Google Meet)
                </label>
                <input
                  type="url"
                  value={newLiveUrl}
                  onChange={(e) => setNewLiveUrl(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors focus:border-violet-400 focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    <Paperclip className="ml-1 inline h-4 w-4 text-violet-500" />
                    رابط المرفق / المذكرة
                  </label>
                  <input
                    type="url"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors focus:border-violet-400 focus:outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    اسم المرفق
                  </label>
                  <input
                    type="text"
                    value={newMediaTitle}
                    onChange={(e) => setNewMediaTitle(e.target.value)}
                    placeholder="مثال: مذكرة الفصل الثالث"
                    className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors focus:border-violet-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSession(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loadingNew || !newTitle.trim() || !newDateTime}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 font-bold text-white shadow-lg shadow-violet-200 transition-colors hover:bg-violet-700 disabled:opacity-50"
                >
                  {loadingNew ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" /> جدولة الحصة
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {attendanceSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-l from-emerald-50 to-white p-5">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-700">
                  <Users className="h-5 w-5" /> رصد الحضور والغياب
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {attendanceSession.title} -{' '}
                  {new Date(attendanceSession.scheduled_at).toLocaleDateString(
                    'ar-EG',
                    { weekday: 'long', day: 'numeric', month: 'long' }
                  )}
                </p>
              </div>
              <button
                onClick={() => setAttendanceSession(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {groupStudents.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <Users className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                <p className="font-bold">لا يوجد طلاب في المجموعة</p>
              </div>
            ) : (
              <>
                {/* Quick select */}
                <div className="flex gap-2 px-5 pt-4">
                  <button
                    onClick={() => {
                      const all: Record<string, AttendanceStatus> = {}
                      groupStudents.forEach((gs) => {
                        all[gs.student_id] = 'present'
                      })
                      setAttendanceMap(all)
                    }}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-50 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> الكل حاضر
                  </button>
                  <button
                    onClick={() => {
                      const all: Record<string, AttendanceStatus> = {}
                      groupStudents.forEach((gs) => {
                        all[gs.student_id] = 'absent'
                      })
                      setAttendanceMap(all)
                    }}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-50 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                  >
                    <XCircle className="h-3.5 w-3.5" /> الكل غائب
                  </button>
                </div>

                <div className="mx-4 mt-3 max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                  {groupStudents.map((gs) => {
                    const p = gs.students?.profiles
                    const status = attendanceMap[gs.student_id] || 'present'
                    return (
                      <div key={gs.id} className="flex items-center gap-3 p-3">
                        <img
                          src={
                            p?.avatar_url ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${p?.full_name || 'U'}`
                          }
                          alt={p?.full_name || ''}
                          className="h-8 w-8 shrink-0 rounded-lg object-cover"
                        />
                        <p className="flex-1 truncate text-sm font-bold text-slate-800">
                          {p?.full_name || 'طالب'}
                        </p>
                        <div className="flex shrink-0 gap-1">
                          {[
                            {
                              val: 'present' as const,
                              icon: CheckCircle,
                              label: 'حاضر',
                              color:
                                'bg-emerald-100 text-emerald-700 border-emerald-300',
                            },
                            {
                              val: 'absent' as const,
                              icon: XCircle,
                              label: 'غائب',
                              color: 'bg-red-100 text-red-700 border-red-300',
                            },
                            {
                              val: 'late' as const,
                              icon: Clock,
                              label: 'متأخر',
                              color:
                                'bg-amber-100 text-amber-700 border-amber-300',
                            },
                          ].map((opt) => (
                            <button
                              key={opt.val}
                              onClick={() =>
                                setAttendanceMap((prev) => ({
                                  ...prev,
                                  [gs.student_id]: opt.val,
                                }))
                              }
                              className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${status === opt.val ? opt.color + ' scale-105 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                              title={opt.label}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Summary */}
                <div className="flex gap-4 px-5 py-3 text-xs text-slate-500">
                  <span className="font-bold text-emerald-600">
                    ✓ حاضر:{' '}
                    {
                      Object.values(attendanceMap).filter(
                        (v) => v === 'present'
                      ).length
                    }
                  </span>
                  <span className="font-bold text-red-600">
                    ✗ غائب:{' '}
                    {
                      Object.values(attendanceMap).filter((v) => v === 'absent')
                        .length
                    }
                  </span>
                  <span className="font-bold text-amber-600">
                    ⧖ متأخر:{' '}
                    {
                      Object.values(attendanceMap).filter((v) => v === 'late')
                        .length
                    }
                  </span>
                </div>

                <div className="flex gap-3 p-5 pt-0">
                  <button
                    onClick={() => setAttendanceSession(null)}
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-bold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingAttendance ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" /> حفظ الحضور
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* مودال التأكيد الموحد للعمليات الحرجة */}
      {confirmData && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            ref={confirmModalRef}
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200">
              <AlertCircle className="h-6 w-6 text-amber-500" aria-hidden="true" />
            </div>
            
            <div className="space-y-2">
              <h3 id="confirm-modal-title" className="text-base font-extrabold text-slate-800">تأكيد الإجراء</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{confirmData.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmData(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  confirmData.onConfirm()
                  setConfirmData(null)
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-amber-600/10"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionRow({
  session,
  onDelete,
  onAttendance,
  isDeleting,
  hasStudents,
  isPast = false,
}: {
  session: Session
  onDelete: () => void
  onAttendance: () => void
  isDeleting: boolean
  hasStudents: boolean
  isPast?: boolean
}) {
  const date = new Date(session.scheduled_at)
  const dateStr = date.toLocaleDateString('ar-EG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeStr = date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 ${isPast ? 'opacity-70' : ''}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-center ${isPast ? 'bg-slate-100' : 'bg-violet-100'}`}
      >
        <span
          className={`text-[9px] font-bold ${isPast ? 'text-slate-500' : 'text-violet-600'}`}
        >
          {dateStr.split(' ')[0]}
        </span>
        <span
          className={`text-base font-black leading-tight ${isPast ? 'text-slate-700' : 'text-violet-700'}`}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">
          {session.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3 w-3" /> {timeStr}
          {session.live_stream_url && (
            <span className="mx-1 text-violet-400">·</span>
          )}
          {session.live_stream_url && (
            <span className="flex items-center gap-0.5 font-bold text-violet-500">
              <Video className="h-3 w-3" /> بث مباشر
            </span>
          )}
          {session.media_url && <span className="mx-1 text-violet-400">·</span>}
          {session.media_url && (
            <span className="flex items-center gap-0.5 font-bold text-indigo-500">
              <Paperclip className="h-3 w-3" /> مرفق
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {session.live_stream_url && (
          <a
            href={session.live_stream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-violet-700"
            title="فتح البث المباشر"
          >
            <ExternalLink className="h-3 w-3" /> بث
          </a>
        )}
        {session.media_url && (
          <a
            href={session.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-200"
            title={session.media_title || 'المرفق'}
          >
            <Paperclip className="h-3 w-3" />
            {session.media_title || 'مرفق'}
          </a>
        )}
        {hasStudents && (
          <button
            onClick={onAttendance}
            className="flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-200"
            title="رصد الحضور"
          >
            <Users className="h-3 w-3" /> حضور
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="rounded-lg bg-red-50 p-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
          title="حذف الحصة"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
