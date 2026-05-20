'use client'

import { useState } from 'react'
import { addStudentToGroupAction } from './actions'
import { UserPlus, Loader2, X, Search, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

type TabType = 'search' | 'register'

export function AddStudentForm({ groupId }: { groupId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('search')

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
        parentPhone: parentPhone.trim() || undefined
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
        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
      >
        <UserPlus className="w-4 h-4" /> إضافة طالب
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" /> إضافة طالب للمجموعة
              </h3>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'search'
                    ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4" /> بحث عن طالب مسجل
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'register'
                    ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4" /> تسجيل طالب جديد
              </button>
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
              <form onSubmit={handleSearch} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني أو كود الطالب</label>
                  <input
                    type="text"
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    placeholder="مثال: student@email.com أو STU-A1B2C3"
                    className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                    dir="ltr"
                    autoFocus
                  />
                </div>
                <div className="bg-indigo-50 text-indigo-700 text-xs p-3 rounded-lg flex gap-2 leading-relaxed">
                  <span className="text-lg">💡</span>
                  <span>سيتمكن الطالب المضاف من رؤية جميع اختبارات وواجبات هذه المجموعة فوراً.</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    إلغاء
                  </button>
                  <button type="submit" disabled={loading || !searchVal.trim()}
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إضافة للمجموعة'}
                  </button>
                </div>
              </form>
            )}

            {/* Register Tab */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">اسم الطالب الكامل <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                    className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني <span className="text-slate-400 font-normal">(اختياري)</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">هاتف ولي الأمر <span className="text-slate-400 font-normal">(اختياري)</span></label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                    dir="ltr"
                  />
                </div>
                <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg flex gap-2 leading-relaxed">
                  <span className="text-lg">⚠️</span>
                  <span>سيتم إنشاء حساب جديد للطالب على المنصة وإضافته للمجموعة تلقائياً.</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleClose}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    إلغاء
                  </button>
                  <button type="submit" disabled={loading || !fullName.trim()}
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserCheck className="w-5 h-5" /> تسجيل وإضافة</>}
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
