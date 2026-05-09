'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Layers, CheckCircle, Loader2, Sparkles, BookOpen, AlertCircle } from 'lucide-react'

export default function BatchExamCreator() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)
  const [error, setError] = useState('')
  const [expertMsg, setExpertMsg] = useState('')

  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])

  const [form, setForm] = useState({
    subjectId: '',
    gradeId: '',
    semesterId: '',
    mode: 'general', // 'general' or 'units'
    numberOfExams: 3,
    questionsPerExam: 15,
    titlePrefix: 'اختبار عام',
    durationMinutes: 60,
    passingScore: '',
    shuffleQuestions: true,
    shuffleOptions: true,
    showResultsImmediately: true,
    allowedAttempts: '1'
  })

  useEffect(() => {
    async function loadMeta() {
      setLoading(true)
      const [subs, grds, sems] = await Promise.all([
        supabase.from('subjects').select('id, name_ar').order('id'),
        supabase.from('grades').select('id, name_ar, stage_id').order('sort_order'),
        supabase.from('semesters').select('id, name_ar').order('sort_order')
      ])
      if (subs.data) setSubjects(subs.data)
      if (grds.data) setGrades(grds.data)
      if (sems.data) setSemesters(sems.data)
      setLoading(false)
    }
    loadMeta()
  }, [supabase])

  // Expert Heuristics Effect
  useEffect(() => {
    if (form.subjectId && form.gradeId && subjects.length > 0 && grades.length > 0) {
      const subject = subjects.find(s => s.id == form.subjectId)
      const grade = grades.find(g => g.id == form.gradeId)
      
      if (subject && grade) {
        applyExpertDefaults(grade.name_ar, subject.name_ar)
      }
    } else {
      setExpertMsg('')
    }
  }, [form.subjectId, form.gradeId])

  const applyExpertDefaults = (gradeName: string, subjectName: string) => {
    let qCount = 15
    let duration = 60
    let attempts = '1'
    let stage = ''

    if (gradeName.includes('الابتدائي')) {
      stage = 'المرحلة الابتدائية'
      qCount = 15
      duration = 45
      attempts = '2'
    } else if (gradeName.includes('الإعدادي')) {
      stage = 'المرحلة الإعدادية'
      qCount = 30
      duration = 90
      attempts = '1'
    } else if (gradeName.includes('الثانوي')) {
      stage = 'المرحلة الثانوية'
      qCount = 40
      duration = 150
      attempts = '1'
    }

    // Adjust duration based on subject
    const mathScience = ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'علوم', 'جبر', 'هندسة']
    const languages = ['عربي', 'لغة عربية', 'انجليزي', 'لغة إنجليزية', 'فرنساوي', 'لغة فرنسية']

    let perQuestion = duration / qCount
    
    if (mathScience.some(s => subjectName.includes(s))) {
      perQuestion += 1.5 
    } else if (languages.some(s => subjectName.includes(s))) {
      perQuestion += 1 
    }

    duration = Math.round(qCount * perQuestion)

    setForm(prev => ({
      ...prev,
      questionsPerExam: qCount,
      durationMinutes: duration,
      allowedAttempts: attempts,
      passingScore: '50'
    }))

    setExpertMsg(`✨ تم ضبط إعدادات الاختبار تلقائياً وفقاً للمعايير التربوية لـ ${stage} (${subjectName}).`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subjectId || !form.gradeId) {
      setError('يرجى اختيار المادة والصف')
      return
    }

    setSaving(true)
    setError('')
    
    try {
      const res = await fetch('/api/admin/exams/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setCreatedCount(data.count)
      setSaved(true)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center bg-white p-10 rounded-3xl border border-border">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-3">تم التوليد بنجاح! 🎉</h2>
        <p className="text-muted-foreground mb-8">
          تم إنشاء <strong className="text-foreground">{createdCount}</strong> اختبار آلياً وإضافتهم إلى قائمة الاختبارات الخاصة بك.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => router.push('/admin/exams')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">
            استعراض الاختبارات
          </button>
          <button onClick={() => { setSaved(false); setForm({ ...form, titlePrefix: '' }) }} className="border border-border px-6 py-3 rounded-xl font-bold hover:bg-muted transition-all">
            إنشاء المزيد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Layers className="w-8 h-8 text-primary" /> 
          توليد الاختبارات بالجملة
        </h1>
        <p className="text-muted-foreground mt-2">
          قم بإنشاء عدة اختبارات بضغطة زر. سيقوم الذكاء الاصطناعي بسحب أسئلة عشوائية من بنك الأسئلة للمادة لإنشاء النماذج.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Metadata */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                البيانات الأساسية
              </h3>
              {expertMsg && (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-fade-in border border-emerald-200">
                  <Sparkles className="w-4 h-4" />
                  {expertMsg}
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-bold mb-2">المادة الدراسية *</label>
                <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  <option value="">اختر المادة...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">الصف الدراسي *</label>
                <select value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  <option value="">اختر الصف...</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">الفصل الدراسي</label>
                <select value={form.semesterId} onChange={e => setForm({ ...form, semesterId: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  <option value="">غير محدد</option>
                  {semesters.map(s => <option key={s.id} value={s.id}>{s.name_ar}</option>)}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Mode Selection */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm">2</span>
              طريقة التوليد
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className={`cursor-pointer border-2 rounded-2xl p-5 flex gap-4 transition-all ${form.mode === 'general' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <input type="radio" name="mode" className="mt-1" checked={form.mode === 'general'} onChange={() => setForm({ ...form, mode: 'general' })} />
                <div>
                  <div className="font-bold text-base mb-1">نماذج عامة للمادة</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">ينشئ أرقام متعددة من النماذج العامة العشوائية تغطي كل وحدات المادة.</div>
                </div>
              </label>

              <label className={`cursor-pointer border-2 rounded-2xl p-5 flex gap-4 transition-all ${form.mode === 'units' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <input type="radio" name="mode" className="mt-1" checked={form.mode === 'units'} onChange={() => setForm({ ...form, mode: 'units' })} />
                <div>
                  <div className="font-bold text-base mb-1 flex items-center gap-2">اختبار لكل وحدة <Sparkles className="w-4 h-4 text-amber-500" /></div>
                  <div className="text-sm text-muted-foreground leading-relaxed">يقوم بإنشاء اختبار مستقل لكل وحدة دراسية مسجلة بالمادة تلقائياً.</div>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-border" />

          {/* Configuration */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm">3</span>
              إعدادات الاختبارات
            </h3>
            
            <div className="grid md:grid-cols-2 gap-5">
              {form.mode === 'general' && (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-2">عدد النماذج المطلوب توليدها</label>
                    <input type="number" min={1} max={20} required value={form.numberOfExams} onChange={e => setForm({ ...form, numberOfExams: parseInt(e.target.value) || 1 })}
                      className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">البادئة لاسم الاختبار (مثل: اختبار عام)</label>
                    <input type="text" required value={form.titlePrefix} onChange={e => setForm({ ...form, titlePrefix: e.target.value })}
                      className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-bold mb-2">عدد الأسئلة في كل اختبار</label>
                <input type="number" min={5} max={100} required value={form.questionsPerExam} onChange={e => setForm({ ...form, questionsPerExam: parseInt(e.target.value) || 15 })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">مدة الاختبار (بالدقائق)</label>
                <input type="number" min={10} max={180} required value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">درجة النجاح المئوية (%) (اختياري)</label>
                <input type="number" min={1} max={100} value={form.passingScore} onChange={e => setForm({ ...form, passingScore: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="مثال: 50" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">عدد المحاولات المسموحة</label>
                <select value={form.allowedAttempts} onChange={e => setForm({ ...form, allowedAttempts: e.target.value })}
                  className="w-full border border-border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  <option value="1">محاولة واحدة</option>
                  <option value="2">محاولتان</option>
                  <option value="3">3 محاولات</option>
                  <option value="-1">غير محدود</option>
                </select>
              </div>
            </div>

            <hr className="border-border my-6" />
            
            <h4 className="text-sm font-bold mb-4">خيارات العرض</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={form.shuffleQuestions} onChange={e => setForm({ ...form, shuffleQuestions: e.target.checked })} className="w-4 h-4 text-primary rounded" />
                <span className="text-sm font-bold">خلط الأسئلة عشوائياً</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={form.shuffleOptions} onChange={e => setForm({ ...form, shuffleOptions: e.target.checked })} className="w-4 h-4 text-primary rounded" />
                <span className="text-sm font-bold">خلط الخيارات عشوائياً</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={form.showResultsImmediately} onChange={e => setForm({ ...form, showResultsImmediately: e.target.checked })} className="w-4 h-4 text-primary rounded" />
                <span className="text-sm font-bold">إظهار النتيجة فوراً</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 md:p-8 border-t border-border flex justify-end">
          <button type="submit" disabled={saving || loading}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center gap-3 shadow-lg shadow-primary/20 disabled:opacity-60">
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري التوليد (قد يستغرق بعض الوقت)...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> توليد الاختبارات الآن</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
