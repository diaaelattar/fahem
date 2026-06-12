'use client'

import { useState, useRef } from 'react'
import { addStudentToGroupAction } from './actions'
import { UserPlus, Loader2, X, Search, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useFocusTrap } from '@/hooks/useFocusTrap'

type TabType = 'search' | 'register'

export function AddStudentForm({ groupId }: { groupId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('search')
  const modalRef = useRef<HTMLDivElement>(null)

  useFocusTrap(modalRef, isOpen, handleClose)

  // Search tab state
  const [searchVal, setSearchVal] = useState('')

  // Register tab state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')

  function resetForm() {
    setSearchVal('')
    setFullName('')
    setEmail('')
    setParentPhone('')
    setActiveTab('search')
  }

  function handleClose() {
    setIsOpen(false)
    resetForm()
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchVal.trim()) return
    setLoading(true)
    try {
      await addStudentToGroupAction(groupId, searchVal)
      toast.success('تم إضافة الطالب بنجاح')
      handleClose()
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) return
    setLoading(true)
    try {
      await addStudentToGroupAction(groupId, '', {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
      })
      toast.success(`تم تسجيل الطالب "${fullName}" وإضافته للمجموعة بنجاح`)
      handleClose()
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" /> إضافة طالب
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-title"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-5">
              <h3 id="add-student-title" className="flex items-center gap-2 text-lg font-bold">
                <UserPlus className="h-5 w-5 text-indigo-500" aria-hidden="true" /> إضافة طالب
                للمجموعة
              </h3>
              <button
                onClick={handleClose}
                aria-label="إغلاق النافذة"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'search'}
                onClick={() => setActiveTab('search')}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                  activeTab === 'search'
                    ? 'border-b-2 border-indigo-500 bg-indigo-50/50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Search className="h-4 w-4" aria-hidden="true" /> بحث عن طالب مسجل
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'register'}
                onClick={() => setActiveTab('register')}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                  activeTab === 'register'
                    ? 'border-b-2 border-indigo-500 bg-indigo-50/50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <UserCheck className="h-4 w-4" aria-hidden="true" /> تسجيل طالب جديد
              </button>
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
              <form onSubmit={handleSearch} className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    البريد الإلكتروني أو كود الطالب
                  </label>
                  <input
                    type="text"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="مثال: student@email.com أو STU-A1B2C3"
                    className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none"
                    dir="ltr"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 rounded-lg bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-700">
                  <span className="text-lg">💡</span>
                  <span>
                    سيتمكن الطالب المضاف من رؤية جميع اختبارات وواجبات هذه
                    المجموعة فوراً.
                  </span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !searchVal.trim()}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    ) : (
                      'إضافة للمجموعة'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Register Tab */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    اسم الطالب الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    البريد الإلكتروني{' '}
                    <span className="font-normal text-slate-400">
                      (اختياري)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    هاتف ولي الأمر{' '}
                    <span className="font-normal text-slate-400">
                      (اختياري)
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl border-2 border-border px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:outline-none"
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
                  <span className="text-lg">⚠️</span>
                  <span>
                    سيتم إنشاء حساب جديد للطالب على المنصة وإضافته للمجموعة
                    تلقائياً.
                  </span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !fullName.trim()}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <UserCheck className="h-5 w-5" aria-hidden="true" /> تسجيل وإضافة
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
