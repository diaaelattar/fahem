'use client'

export {}

import { useState } from 'react'
import { createSessionAction, deleteSessionAction, saveAttendanceAction } from './actions'
import {
  Calendar, Plus, X, Loader2, ExternalLink, Paperclip,
  Users, CheckCircle, XCircle, Clock, Trash2, Video
} from 'lucide-react'
import { toast } from 'sonner'

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
  groupStudents
}: {
  groupId: string
  sessions: Session[]
  groupStudents: GroupStudent[]
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [showNewSession, setShowNewSession] = useState(false)
  const [loadingNew, setLoadingNew] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [attendanceSession, setAttendanceSession] = useState<Session | null>(null)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({})
  const [savingAttendance, setSavingAttendance] = useState(false)

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
        mediaTitle: newMediaTitle || undefined
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
    if (!confirm('هل تريد حذف هذه الحصة؟')) return
    setDeletingId(sessionId)
    try {
      await deleteSessionAction(sessionId, groupId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast.success('تم حذف الحصة')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  function openAttendance(session: Session) {
    setAttendanceSession(session)
    // Default all to 'present'
    const defaults: Record<string, AttendanceStatus> = {}
    groupStudents.forEach(gs => {
      defaults[gs.student_id] = 'present'
    })
    setAttendanceMap(defaults)
  }

  async function handleSaveAttendance() {
    if (!attendanceSession) return
    setSavingAttendance(true)
    try {
      const data = groupStudents.map(gs => ({
        studentId: gs.student_id,
        status: attendanceMap[gs.student_id] || 'absent'
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

  const upcoming = sessions.filter(s => new Date(s.scheduled_at) >= new Date()).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const past = sessions.filter(s => new Date(s.scheduled_at) < new Date()).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-violet-500" />
          الحصص والمواعيد ({sessions.length})
        </h2>
        <button
          onClick={() => setShowNewSession(true)}
          className="text-xs font-bold text-violet-600 hover:bg-violet-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> جدولة حصة جديدة
        </button>
      </div>

      {/* Sessions List */}
      <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="font-bold mb-1">لا توجد حصص مجدولة بعد</p>
            <p className="text-sm">اضغط "جدولة حصة جديدة" لإضافة موعدك الأول</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wide">قادمة</p>
                {upcoming.map(session => (
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
                <p className="px-4 pt-3 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wide">سابقة</p>
                {past.map(session => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-l from-violet-50 to-white">
              <h3 className="font-bold text-lg flex items-center gap-2 text-violet-700">
                <Calendar className="w-5 h-5" /> جدولة حصة جديدة
              </h3>
              <button onClick={() => setShowNewSession(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">عنوان الحصة <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="مثال: مراجعة الفصل الثالث"
                  className="w-full px-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-violet-400 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">التاريخ والوقت <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={newDateTime}
                  onChange={e => setNewDateTime(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-violet-400 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  <Video className="w-4 h-4 inline ml-1 text-violet-500" />
                  رابط البث المباشر (Zoom / Google Meet)
                </label>
                <input
                  type="url"
                  value={newLiveUrl}
                  onChange={e => setNewLiveUrl(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-violet-400 transition-colors"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    <Paperclip className="w-4 h-4 inline ml-1 text-violet-500" />
                    رابط المرفق / المذكرة
                  </label>
                  <input
                    type="url"
                    value={newMediaUrl}
                    onChange={e => setNewMediaUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-violet-400 transition-colors"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المرفق</label>
                  <input
                    type="text"
                    value={newMediaTitle}
                    onChange={e => setNewMediaTitle(e.target.value)}
                    placeholder="مثال: مذكرة الفصل الثالث"
                    className="w-full px-4 py-2.5 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-violet-400 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSession(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loadingNew || !newTitle.trim() || !newDateTime}
                  className="flex-[2] bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-200"
                >
                  {loadingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calendar className="w-4 h-4" /> جدولة الحصة</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {attendanceSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-l from-emerald-50 to-white">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-700">
                  <Users className="w-5 h-5" /> رصد الحضور والغياب
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{attendanceSession.title} - {new Date(attendanceSession.scheduled_at).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <button onClick={() => setAttendanceSession(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {groupStudents.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="font-bold">لا يوجد طلاب في المجموعة</p>
              </div>
            ) : (
              <>
                {/* Quick select */}
                <div className="px-5 pt-4 flex gap-2">
                  <button onClick={() => {
                    const all: Record<string, AttendanceStatus> = {}
                    groupStudents.forEach(gs => { all[gs.student_id] = 'present' })
                    setAttendanceMap(all)
                  }} className="flex-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 rounded-xl transition-colors flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> الكل حاضر
                  </button>
                  <button onClick={() => {
                    const all: Record<string, AttendanceStatus> = {}
                    groupStudents.forEach(gs => { all[gs.student_id] = 'absent' })
                    setAttendanceMap(all)
                  }} className="flex-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-xl transition-colors flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> الكل غائب
                  </button>
                </div>

                <div className="divide-y divide-border max-h-64 overflow-y-auto mx-4 mt-3 border border-border rounded-xl">
                  {groupStudents.map(gs => {
                    const p = gs.students?.profiles
                    const status = attendanceMap[gs.student_id] || 'present'
                    return (
                      <div key={gs.id} className="flex items-center gap-3 p-3">
                        <img
                          src={p?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p?.full_name || 'U'}`}
                          alt={p?.full_name || ''}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <p className="flex-1 font-bold text-sm text-slate-800 truncate">{p?.full_name || 'طالب'}</p>
                        <div className="flex gap-1 shrink-0">
                          {([
                            { val: 'present' as const, icon: CheckCircle, label: 'حاضر', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                            { val: 'absent' as const, icon: XCircle, label: 'غائب', color: 'bg-red-100 text-red-700 border-red-300' },
                            { val: 'late' as const, icon: Clock, label: 'متأخر', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                          ]).map(opt => (
                            <button
                              key={opt.val}
                              onClick={() => setAttendanceMap(prev => ({ ...prev, [gs.student_id]: opt.val }))}
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${status === opt.val ? opt.color + ' shadow-sm scale-105' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
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
                <div className="px-5 py-3 text-xs text-slate-500 flex gap-4">
                  <span className="text-emerald-600 font-bold">✓ حاضر: {Object.values(attendanceMap).filter(v => v === 'present').length}</span>
                  <span className="text-red-600 font-bold">✗ غائب: {Object.values(attendanceMap).filter(v => v === 'absent').length}</span>
                  <span className="text-amber-600 font-bold">⧖ متأخر: {Object.values(attendanceMap).filter(v => v === 'late').length}</span>
                </div>

                <div className="p-5 pt-0 flex gap-3">
                  <button
                    onClick={() => setAttendanceSession(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-200"
                  >
                    {savingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> حفظ الحضور</>}
                  </button>
                </div>
              </>
            )}
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
  isPast = false
}: {
  session: Session
  onDelete: () => void
  onAttendance: () => void
  isDeleting: boolean
  hasStudents: boolean
  isPast?: boolean
}) {
  const date = new Date(session.scheduled_at)
  const dateStr = date.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors ${isPast ? 'opacity-70' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 text-center ${isPast ? 'bg-slate-100' : 'bg-violet-100'}`}>
        <span className={`text-[9px] font-bold ${isPast ? 'text-slate-500' : 'text-violet-600'}`}>{dateStr.split(' ')[0]}</span>
        <span className={`text-base font-black leading-tight ${isPast ? 'text-slate-700' : 'text-violet-700'}`}>{date.getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-800 truncate">{session.title}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" /> {timeStr}
          {session.live_stream_url && <span className="mx-1 text-violet-400">·</span>}
          {session.live_stream_url && <span className="text-violet-500 font-bold flex items-center gap-0.5"><Video className="w-3 h-3" /> بث مباشر</span>}
          {session.media_url && <span className="mx-1 text-violet-400">·</span>}
          {session.media_url && <span className="text-indigo-500 font-bold flex items-center gap-0.5"><Paperclip className="w-3 h-3" /> مرفق</span>}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {session.live_stream_url && (
          <a
            href={session.live_stream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            title="فتح البث المباشر"
          >
            <ExternalLink className="w-3 h-3" /> بث
          </a>
        )}
        {session.media_url && (
          <a
            href={session.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            title={session.media_title || 'المرفق'}
          >
            <Paperclip className="w-3 h-3" />
            {session.media_title || 'مرفق'}
          </a>
        )}
        {hasStudents && (
          <button
            onClick={onAttendance}
            className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            title="رصد الحضور"
          >
            <Users className="w-3 h-3" /> حضور
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold p-1.5 rounded-lg transition-colors"
          title="حذف الحصة"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}
