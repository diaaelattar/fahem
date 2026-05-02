'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import {
  UploadCloud, Youtube, FileText, Loader2, CheckCircle,
  AlertCircle, Brain, ChevronDown, X, FileVideo, FileAudio, Image
} from 'lucide-react'
import { QuestionPreviewGrid } from './QuestionPreviewGrid'

interface Props {
  subjects: { id: number; name_ar: string; icon: string }[]
  grades: { id: number; name_ar: string; grade_number: number }[]
}

type Tab = 'upload' | 'paste' | 'youtube'
type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <span className="text-red-500">📄</span>,
  docx: <span className="text-blue-500">📘</span>,
  pptx: <span className="text-orange-500">📊</span>,
  mp3: <FileAudio className="w-5 h-5 text-purple-500" />,
  mp4: <FileVideo className="w-5 h-5 text-pink-500" />,
  jpg: <Image className="w-5 h-5 text-green-500" />,
  png: <Image className="w-5 h-5 text-green-500" />,
}

export function ContentUploader({ subjects, grades }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
  const [documentId, setDocumentId] = useState('')

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      if (!title) setTitle(accepted[0].name.replace(/\.[^/.]+$/, ''))
    }
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 100 * 1024 * 1024,
    maxFiles: 1,
  })

  const handleProcess = async () => {
    if (!title.trim()) { setErrorMsg('أدخل عنواناً للمحتوى'); return }
    if (!subjectId) { setErrorMsg('اختر المادة الدراسية'); return }
    if (!gradeId) { setErrorMsg('اختر الصف الدراسي'); return }
    if (tab === 'upload' && !file) { setErrorMsg('اختر ملفاً للرفع'); return }
    if (tab === 'paste' && !pastedText.trim()) { setErrorMsg('الصق نصاً تعليمياً'); return }
    if (tab === 'youtube' && !youtubeUrl.trim()) { setErrorMsg('أدخل رابط يوتيوب'); return }

    setErrorMsg('')
    setStatus('uploading')
    setProgress(10)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      let fileUrl: string | null = null
      let fileType = tab === 'paste' ? 'text' : tab === 'youtube' ? 'youtube' : ''

      // رفع الملف إلى Supabase Storage
      if (tab === 'upload' && file) {
        fileType = file.name.split('.').pop()?.toLowerCase() || 'pdf'
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw new Error(`فشل رفع الملف: ${uploadError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(uploadData.path)
        fileUrl = publicUrl
      }

      setProgress(30)

      // إنشاء سجل المستند في قاعدة البيانات
      const { data: doc, error: docError } = await supabase.from('documents').insert({
        admin_id: user.id,
        title: title.trim(),
        file_url: fileUrl,
        file_type: fileType as any,
        youtube_url: tab === 'youtube' ? youtubeUrl : null,
        extracted_text: tab === 'paste' ? pastedText : null,
        processing_status: 'pending',
        subject_id: parseInt(subjectId),
        grade_id: parseInt(gradeId),
      }).select().single()

      if (docError) throw new Error(`فشل حفظ البيانات: ${docError.message}`)
      setDocumentId(doc.id)
      setProgress(50)
      setStatus('processing')

      // استدعاء API لتوليد الأسئلة
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          fileType,
          pastedText: tab === 'paste' ? pastedText : undefined,
          youtubeUrl: tab === 'youtube' ? youtubeUrl : undefined,
          subjectId,
          gradeId,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'فشل توليد الأسئلة')
      }

      const result = await response.json()
      setProgress(100)
      setGeneratedQuestions(result.questions || [])
      setStatus('done')

    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع')
      setStatus('error')
    }
  }

  if (status === 'done' && generatedQuestions.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">تم توليد {generatedQuestions.length} سؤالاً بنجاح! راجعها وأضفها لبنك الأسئلة.</span>
        </div>
        <QuestionPreviewGrid questions={generatedQuestions} documentId={documentId} />
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Upload Area */}
      <div className="lg:col-span-2 space-y-5">
        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex border-b border-border">
            {([
              { id: 'upload', icon: UploadCloud, label: 'رفع ملف' },
              { id: 'paste', icon: FileText, label: 'لصق نص' },
              { id: 'youtube', icon: Youtube, label: 'رابط يوتيوب' },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${
                  tab === id
                    ? 'text-primary border-b-2 border-primary bg-primary/3'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'upload' && (
              <div className="space-y-4">
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                }`}>
                  <input {...getInputProps()} />
                  <UploadCloud className={`w-14 h-14 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-base font-semibold mb-1">
                    {isDragActive ? 'أفلت الملف هنا...' : 'اسحب وأفلت الملف هنا'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">أو اضغط لاختيار الملف</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['PDF', 'Word', 'PPT', 'MP3', 'MP4', 'صورة'].map(f => (
                      <span key={f} className="text-xs bg-muted px-2.5 py-1 rounded-full font-medium">{f}</span>
                    ))}
                  </div>
                </div>
                {file && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-xl">{FILE_ICONS[file.name.split('.').pop()?.toLowerCase() || ''] || '📎'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === 'paste' && (
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder="الصق النص التعليمي هنا...&#10;&#10;مثال: نص درس من الكتاب المدرسي، شرح من المذكرة، ملخص وحدة دراسية..."
                className="w-full h-52 px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed"
              />
            )}

            {tab === 'youtube' && (
              <div className="space-y-4">
                <div className="relative">
                  <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pr-10 pl-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  💡 سيتم تفريغ الصوت من الفيديو وتحويله إلى نص باستخدام Whisper AI، ثم توليد أسئلة من المحتوى.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Process Button */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="font-medium text-sm">
                {status === 'uploading' ? 'جاري رفع الملف...' : '🤖 الذكاء الاصطناعي يحلل المحتوى ويولد الأسئلة...'}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{progress}٪ مكتمل</p>
          </div>
        )}

        <button onClick={handleProcess}
          disabled={status === 'uploading' || status === 'processing'}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm">
          {status === 'uploading' || status === 'processing'
            ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
            : <><Brain className="w-5 h-5" /> توليد الأسئلة بالذكاء الاصطناعي</>
          }
        </button>
      </div>

      {/* Sidebar - Settings */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h3 className="font-bold text-base">إعدادات المحتوى</h3>

          <div>
            <label className="text-sm font-semibold block mb-1.5">عنوان المحتوى *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="مثال: وحدة الجبر - الصف الثالث الثانوي"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5">المادة الدراسية *</label>
            <div className="relative">
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="">اختر المادة</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name_ar}</option>)}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1.5">الصف الدراسي *</label>
            <div className="relative">
              <select value={gradeId} onChange={e => setGradeId(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                <option value="">اختر الصف</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name_ar}</option>)}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h4 className="font-bold text-blue-800 text-sm mb-3">💡 نصائح لنتائج أفضل</h4>
          <ul className="text-xs text-blue-700 space-y-2 leading-relaxed">
            <li>• كلما كان المحتوى أوضح وأطول، كانت الأسئلة أدق</li>
            <li>• PDF و Word يعطيان أفضل النتائج</li>
            <li>• تأكد من صحة اختيار المادة والصف</li>
            <li>• يمكنك رفع أجزاء من الوحدة الدراسية بشكل منفصل</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
