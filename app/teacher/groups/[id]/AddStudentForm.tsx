'use client'

import { useState } from 'react'
import { addStudentToGroupAction } from './actions'
import { UserPlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

export function AddStudentForm({ groupId }: { groupId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!searchVal.trim()) return
    
    setLoading(true)
    try {
      await addStudentToGroupAction(groupId, searchVal)
      toast.success('تم إضافة الطالب بنجاح')
      setSearchVal('')
      setIsOpen(false)
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
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" /> إضافة طالب يدوياً
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني أو كود الطالب</label>
                <input 
                  type="text" 
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="مثال: student@email.com أو STU-A1B2C3"
                  className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                  dir="ltr"
                />
              </div>
              
              <div className="bg-indigo-50 text-indigo-700 text-xs p-3 rounded-lg flex gap-2 leading-relaxed">
                <span className="text-lg">💡</span>
                <span>سيتمكن الطالب المضاف من رؤية جميع اختبارات وواجبات هذه المجموعة في لوحة تحكمه فوراً، تماماً وكأنه انضم بكود الدعوة.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !searchVal.trim()}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إضافة للمجموعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
