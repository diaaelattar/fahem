'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import {
  UploadCloud,
  Youtube,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  ChevronDown,
  X,
  FileVideo,
  FileAudio,
  Image,
  Sparkles,
} from 'lucide-react'
import { QuestionPreviewGrid } from './QuestionPreviewGrid'
import { PDFDocument } from 'pdf-lib'

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
  mp3: <FileAudio className="h-5 w-5 text-purple-500" />,
  mp4: <FileVideo className="h-5 w-5 text-pink-500" />,
  jpg: <Image className="h-5 w-5 text-green-500" />,
  png: <Image className="h-5 w-5 text-green-500" />,
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
  const [expertMsg, setExpertMsg] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
  const [documentId, setDocumentId] = useState('')
  const [generationMode, setGenerationMode] = useState<
    'SMART_GEN' | 'EXACT_EXTRACT'
  >('SMART_GEN')
  const [questionCount, setQuestionCount] = useState(12)
  const [requestedTypes, setRequestedTypes] = useState<string[]>([
    'mcq',
    'true_false',
    'fill_blank',
  ])
  const [targetCognitiveLevel, setTargetCognitiveLevel] = useState('متنوع')
  const [customInstructions, setCustomInstructions] = useState('')
  const [passageBased, setPassageBased] = useState(false)

  const [units, setUnits] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [unitId, setUnitId] = useState('')
  const [lessonId, setLessonId] = useState('')

  // جلب الوحدات
  useEffect(() => {
    async function fetchUnits() {
      if (subjectId && gradeId) {
        const { data } = await supabase
          .from('units')
          .select('id, name_ar, semester')
          .eq('subject_id', subjectId)
          .eq('grade_id', gradeId)

        setUnits(data || [])
      } else {
        setUnits([])
        setUnitId('')
        setLessons([])
        setLessonId('')
      }
    }
    fetchUnits()
  }, [subjectId, gradeId])

  // جلب الدروس
  useEffect(() => {
    async function fetchLessons() {
      if (unitId) {
        const { data } = await supabase
          .from('lessons')
          .select('id, name_ar')
          .eq('unit_id', unitId)

        setLessons(data || [])
      } else {
        setLessons([])
        setLessonId('')
      }
    }
    fetchLessons()
  }, [unitId])

  // Expert Heuristics Effect
  useEffect(() => {
    if (subjectId && gradeId && subjects.length > 0 && grades.length > 0) {
      const subject = subjects.find((s) => s.id.toString() === subjectId)
      const grade = grades.find((g) => g.id.toString() === gradeId)

      if (subject && grade) {
        applyExpertDefaults(grade.name_ar, subject.name_ar)
      }
    } else {
      setExpertMsg('')
    }
  }, [subjectId, gradeId])

  const applyExpertDefaults = (gradeName: string, subjectName: string) => {
    let qCount = 12
    let cognitive = 'متنوع'
    let qTypes = ['mcq', 'true_false', 'fill_blank']
    let stage = ''

    if (gradeName.includes('الابتدائي')) {
      stage = 'المرحلة الابتدائية'
      qCount = 10
      cognitive = 'أساسي (تذكر وفهم)'
      qTypes = ['mcq', 'true_false']
    } else if (gradeName.includes('الإعدادي')) {
      stage = 'المرحلة الإعدادية'
      qCount = 15
      cognitive = 'متوسط (تطبيق وتحليل)'
      qTypes = ['mcq', 'true_false', 'fill_blank']
    } else if (gradeName.includes('الثانوي')) {
      stage = 'المرحلة الثانوية'
      qCount = 20
      cognitive = 'متقدم (تحليل وتقييم وإبداع)'
      qTypes = ['mcq'] // نظام الثانوية يعتمد على الاختيار المتعدد
    }

    setQuestionCount(qCount)
    setTargetCognitiveLevel(cognitive)
    setRequestedTypes(qTypes)
    setExpertMsg(
      `✨ تم ضبط الذكاء الاصطناعي لاستخلاص الأسئلة وفقاً للمعايير التربوية لـ ${stage} (${subjectName}).`
    )
  }

  // ─── خيارات التجزئة المتقدمة ──────────────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [pageRange, setPageRange] = useState('') // مثال: 1-5, 8, 10-12
  const [isChunked, setIsChunked] = useState(true)
  const [chunkSize, setChunkSize] = useState(3)
  const [processingLogs, setProcessingLogs] = useState<
    {
      id: string
      msg: string
      status: 'info' | 'success' | 'error' | 'loading'
    }[]
  >([])

  const addLog = (
    msg: string,
    status: 'info' | 'success' | 'error' | 'loading' = 'info'
  ) => {
    setProcessingLogs((prev) =>
      [
        { id: Math.random().toString(36).substring(7), msg, status },
        ...prev,
      ].slice(0, 10)
    )
  }

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) {
        setFile(accepted[0])
        if (!title) setTitle(accepted[0].name.replace(/\.[^/.]+$/, ''))
      }
    },
    [title]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        ['.pptx'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 100 * 1024 * 1024,
    maxFiles: 1,
  })

  const handleProcess = async () => {
    if (!title.trim()) {
      setErrorMsg('أدخل عنواناً للمحتوى')
      return
    }
    if (!subjectId) {
      setErrorMsg('اختر المادة الدراسية')
      return
    }
    if (!gradeId) {
      setErrorMsg('اختر الصف الدراسي')
      return
    }
    if (tab === 'upload' && !file) {
      setErrorMsg('اختر ملفاً للرفع')
      return
    }
    if (tab === 'paste' && !pastedText.trim()) {
      setErrorMsg('الصق نصاً تعليمياً')
      return
    }
    if (tab === 'youtube' && !youtubeUrl.trim()) {
      setErrorMsg('أدخل رابط يوتيوب')
      return
    }

    setErrorMsg('')
    setStatus('uploading')
    setProgress(10)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('غير مسجل الدخول')

      let fileUrl: string | null = null
      let fileType =
        tab === 'paste' ? 'text' : tab === 'youtube' ? 'youtube' : ''

      // رفع الملف إلى Supabase Storage باستخدام API لتخطي الـ RLS
      if (tab === 'upload' && file) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf'
        fileType = fileExt
        const safeName = Math.random().toString(36).substring(2, 10)
        const fileName = `${user.id}/${Date.now()}-${safeName}.${fileExt}`

        const tokenRes = await fetch('/api/upload-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName }),
        })

        if (!tokenRes.ok) {
          const err = await tokenRes.json()
          throw new Error(err.error || 'تعذر الحصول على إذن رفع الملف')
        }

        const { token } = await tokenRes.json()

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .uploadToSignedUrl(fileName, token, file)

        if (uploadError)
          throw new Error(`فشل رفع الملف: ${uploadError.message}`)

        const {
          data: { publicUrl },
        } = supabase.storage.from('documents').getPublicUrl(fileName)
        fileUrl = publicUrl
        addLog(`تم رفع الملف بنجاح: ${file.name}`, 'success')
      }

      setProgress(30)
      addLog('جاري إنشاء سجل المستند...', 'loading')

      // إنشاء سجل المستند في قاعدة البيانات باستخدام API لتخطي الـ RLS
      const docRes = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          file_url: fileUrl,
          file_type: fileType,
          youtube_url: tab === 'youtube' ? youtubeUrl : null,
          extracted_text: tab === 'paste' ? pastedText : null,
          processing_status: 'pending',
          subject_id: parseInt(subjectId),
          grade_id: parseInt(gradeId),
          unit_id: unitId ? parseInt(unitId) : null,
          lesson_id: lessonId ? parseInt(lessonId) : null,
        }),
      })

      if (!docRes.ok) {
        const err = await docRes.json()
        throw new Error(err.error || 'فشل حفظ البيانات')
      }

      const { doc } = await docRes.json()
      setDocumentId(doc.id)
      setProgress(40)
      setStatus('processing')

      // ─── منطق التجزئة والمعالجة الذكية ──────────────────────────────────────
      let allQuestions: any[] = []
      let combinedMetadata: any = { total_questions: 0, topics_covered: [] }

      if (
        tab === 'upload' &&
        file &&
        (file.type === 'application/pdf' || fileType === 'pdf')
      ) {
        addLog('جاري تحليل ملف PDF وتجهيز الأجزاء...', 'loading')

        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const totalPages = pdfDoc.getPageCount()
        addLog(`تم العثور على ${totalPages} صفحة.`, 'info')

        // تحديد الصفحات المراد معالجتها
        let targetPages: number[] = []
        if (pageRange.trim()) {
          // تحليل النطاق (مثلاً: 1-3, 5)
          const parts = pageRange.split(',')
          parts.forEach((part) => {
            const range = part.trim().split('-')
            if (range.length === 2) {
              const start = parseInt(range[0])
              const end = parseInt(range[1])
              for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= totalPages) targetPages.push(i - 1)
              }
            } else {
              const p = parseInt(range[0])
              if (p >= 1 && p <= totalPages) targetPages.push(p - 1)
            }
          })
          // إزالة التكرار والترتيب
          targetPages = Array.from(new Set(targetPages)).sort((a, b) => a - b)
        } else {
          // كل الصفحات
          targetPages = Array.from({ length: totalPages }, (_, i) => i)
        }

        if (targetPages.length === 0)
          throw new Error('تحديد نطاق الصفحات غير صحيح أو خارج نطاق الملف')

        // تقسيم الصفحات إلى مجموعات متداخلة (Overlapping Chunks)
        // التداخل بصفحة واحدة يضمن عدم ضياع السؤال المقسم بين صفحتين
        const currentChunkSize = isChunked
          ? Math.max(2, chunkSize)
          : targetPages.length
        const chunks: number[][] = []

        if (isChunked && currentChunkSize < targetPages.length) {
          let i = 0
          while (i < targetPages.length) {
            chunks.push(targetPages.slice(i, i + currentChunkSize))
            if (i + currentChunkSize >= targetPages.length) break
            i += currentChunkSize - 1 // التقدم مع ترك صفحة واحدة للتداخل
          }
        } else {
          chunks.push(targetPages)
        }

        addLog(`سيتم معالجة الملف على ${chunks.length} مرحلة.`, 'info')

        for (let i = 0; i < chunks.length; i++) {
          const chunkPages = chunks[i]
          addLog(
            `جاري معالجة المرحلة ${i + 1}/${chunks.length} (الصفحات: ${chunkPages[0] + 1}-${chunkPages[chunkPages.length - 1] + 1})...`,
            'loading'
          )

          // إنشاء ملف PDF صغير لهذا الجزء
          const chunkPdf = await PDFDocument.create()
          const copiedPages = await chunkPdf.copyPages(pdfDoc, chunkPages)
          copiedPages.forEach((p) => chunkPdf.addPage(p))
          const chunkBuffer = await chunkPdf.save()
          const chunkBase64 = btoa(
            Array.from(chunkBuffer)
              .map((byte) => String.fromCharCode(byte))
              .join('')
          )

          // إرسال للجيمناي
          let retryCount = 0
          const maxRetries = 3
          let success = false

          while (retryCount < maxRetries && !success) {
            try {
              const response = await fetch('/api/ai/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  documentId: doc.id,
                  fileType: 'pdf',
                  subjectId,
                  gradeId,
                  chunkIndex: i,
                  totalChunks: chunks.length,
                  fileData: chunkBase64,
                  questionCount,
                  requestedTypes,
                  targetCognitiveLevel,
                  customInstructions,
                  generationMode,
                  passageBased,
                }),
              })

              if (!response.ok) {
                const err = await response.json()
                if (response.status === 429) {
                  addLog(
                    `تجاوزت حد الطلبات المسموح به (Quota Exceeded). جاري الانتظار دقيقة واحدة...`,
                    'error'
                  )
                  await new Promise((r) => setTimeout(r, 60000))
                  throw new Error('Quota Exceeded')
                }
                throw new Error(err.error || 'فشل توليد الأسئلة لهذا الجزء')
              }

              const result = await response.json()
              allQuestions = [...allQuestions, ...result.questions]
              combinedMetadata.total_questions += result.questions.length
              if (result.metadata?.topics_covered) {
                combinedMetadata.topics_covered = Array.from(
                  new Set([
                    ...combinedMetadata.topics_covered,
                    ...result.metadata.topics_covered,
                  ])
                )
              }

              success = true
              addLog(
                `المرحلة ${i + 1} مكتملة: تم توليد ${result.questions.length} سؤالاً.`,
                'success'
              )

              // إضافة تأخير إلزامي لتفادي الـ Rate Limit (Quota) في النسخة المجانية
              if (i < chunks.length - 1) {
                addLog(
                  'نظام حماية الكوتا: انتظار 15 ثانية قبل المرحلة التالية...',
                  'info'
                )
                await new Promise((r) => setTimeout(r, 15000))
              }
            } catch (chunkErr: any) {
              retryCount++
              if (retryCount < maxRetries) {
                const delay = retryCount * 8000 // زيادة وقت الانتظار (8ث، 16ث، 24ث)
                const isRateLimit =
                  chunkErr.message.includes('503') ||
                  chunkErr.message.includes('429') ||
                  chunkErr.message.includes('Quota')
                const errorLogPrefix = isRateLimit
                  ? 'النموذج مشغول أو تم تجاوز الكوتا'
                  : chunkErr.message
                addLog(
                  `${errorLogPrefix}. إعادة محاولة المرحلة ${i + 1} خلال ${delay / 1000} ثانية... (محاولة ${retryCount}/${maxRetries})`,
                  'error'
                )
                await new Promise((r) => setTimeout(r, delay))
              } else {
                addLog(
                  `تعذر إكمال المرحلة ${i + 1} بعد ${maxRetries} محاولات: ${chunkErr.message}`,
                  'error'
                )
                // نستمر للأجزاء التالية لعلها تنجح
              }
            }
          }

          setProgress(Math.round(40 + ((i + 1) / chunks.length) * 60))
        }

        // إزالة الأسئلة المكررة الناتجة عن تداخل الصفحات
        if (isChunked && chunks.length > 1) {
          addLog(
            'جاري إزالة الأسئلة المكررة الناتجة عن دمج الأجزاء...',
            'loading'
          )
          const uniqueMap = new Map()
          allQuestions.forEach((q) => {
            if (!q.question_text) return
            // توحيد النص للبحث عن التطابق (إزالة المسافات الزائدة، التشكيل، وعلامات الترقيم)
            const norm = q.question_text
              .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
              .replace(/[^\u0621-\u064A0-9a-zA-Z]/g, '') // ترك الحروف والأرقام فقط
              .toLowerCase()

            if (norm.length > 5 && !uniqueMap.has(norm)) {
              uniqueMap.set(norm, q)
            } else if (norm.length <= 5 && !uniqueMap.has(q.question_text)) {
              uniqueMap.set(q.question_text, q)
            }
          })
          const originalCount = allQuestions.length
          allQuestions = Array.from(uniqueMap.values())
          if (originalCount > allQuestions.length) {
            addLog(
              `تمت تصفية ${originalCount - allQuestions.length} سؤال مكرر.`,
              'info'
            )
          }
        }
      } else {
        // المسارات الأخرى (نص ملصوق، إلخ) - معالجة واحدة
        addLog('جاري توليد الأسئلة من النص...', 'loading')
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
            generationMode,
            questionCount,
            requestedTypes,
            targetCognitiveLevel,
            customInstructions,
            passageBased,
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'فشل توليد الأسئلة')
        }

        const result = await response.json()
        allQuestions = result.questions || []
        combinedMetadata = result.metadata
        addLog('اكتمل توليد كافة الأسئلة بنجاح!', 'success')
      }

      setGeneratedQuestions(allQuestions)
      setProgress(100)
      setStatus('done')
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ غير متوقع')
      setStatus('error')
    }
  }

  if (status === 'done' && generatedQuestions.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800">
            تم توليد {generatedQuestions.length} سؤالاً بنجاح! راجعها وأضفها
            لبنك الأسئلة.
          </span>
        </div>
        <QuestionPreviewGrid
          questions={generatedQuestions}
          documentId={documentId}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Upload Area */}
      <div className="space-y-5 lg:col-span-2">
        {/* Tabs */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex border-b border-border">
            {(
              [
                { id: 'upload', icon: UploadCloud, label: 'رفع ملف' },
                { id: 'paste', icon: FileText, label: 'لصق نص' },
                { id: 'youtube', icon: Youtube, label: 'رابط يوتيوب' },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all ${
                  tab === id
                    ? 'bg-primary/3 border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'upload' && (
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud
                    className={`mx-auto mb-4 h-14 w-14 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <p className="mb-1 text-base font-semibold">
                    {isDragActive
                      ? 'أفلت الملف هنا...'
                      : 'اسحب وأفلت الملف هنا'}
                  </p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    أو اضغط لاختيار الملف
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['PDF', 'Word', 'PPT', 'MP3', 'MP4', 'صورة'].map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                {file && (
                  <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="text-xl">
                      {FILE_ICONS[
                        file.name.split('.').pop()?.toLowerCase() || ''
                      ] || '📎'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-muted-foreground transition-colors hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === 'paste' && (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="الصق النص التعليمي هنا...&#10;&#10;مثال: نص درس من الكتاب المدرسي، شرح من المذكرة، ملخص وحدة دراسية..."
                className="h-52 w-full resize-none rounded-xl border border-border px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}

            {tab === 'youtube' && (
              <div className="space-y-4">
                <div className="relative">
                  <Youtube className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-500" />
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-xl border border-border py-3 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                </div>
                <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-muted-foreground">
                  💡 سيتم تفريغ الصوت من الفيديو وتحويله إلى نص باستخدام Whisper
                  AI، ثم توليد أسئلة من المحتوى.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Process Button */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Generation Mode Selector */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
          <label className="mb-3 block text-sm font-bold text-indigo-900">
            محرك المعالجة بالذكاء الاصطناعي V3.5
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${generationMode === 'SMART_GEN' ? 'border-primary bg-white shadow-sm' : 'border-transparent bg-indigo-100/50 hover:bg-indigo-100'}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="generationMode"
                  value="SMART_GEN"
                  checked={generationMode === 'SMART_GEN'}
                  onChange={() => setGenerationMode('SMART_GEN')}
                  className="hidden"
                />
                <Brain
                  className={`h-5 w-5 ${generationMode === 'SMART_GEN' ? 'text-primary' : 'text-indigo-400'}`}
                />
                <div>
                  <div
                    className={`text-sm font-bold ${generationMode === 'SMART_GEN' ? 'text-primary' : 'text-indigo-900'}`}
                  >
                    توليد ذكي
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ابتكار أسئلة جديدة من المحتوى
                  </div>
                </div>
              </div>
            </label>
            <label
              className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${generationMode === 'EXACT_EXTRACT' ? 'border-primary bg-white shadow-sm' : 'border-transparent bg-indigo-100/50 hover:bg-indigo-100'}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="generationMode"
                  value="EXACT_EXTRACT"
                  checked={generationMode === 'EXACT_EXTRACT'}
                  onChange={() => setGenerationMode('EXACT_EXTRACT')}
                  className="hidden"
                />
                <FileText
                  className={`h-5 w-5 ${generationMode === 'EXACT_EXTRACT' ? 'text-primary' : 'text-indigo-400'}`}
                />
                <div>
                  <div
                    className={`text-sm font-bold ${generationMode === 'EXACT_EXTRACT' ? 'text-primary' : 'text-indigo-900'}`}
                  >
                    رقمنة حرفية
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    استخراج الامتحان الحرفي المرفق وحله
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {(status === 'uploading' || status === 'processing') && (
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="mb-3 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {status === 'uploading'
                  ? 'جاري رفع الملف...'
                  : '🤖 الذكاء الاصطناعي يحلل المحتوى ويولد الأسئلة...'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {progress}٪ مكتمل
            </p>
          </div>
        )}

        <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="group flex w-full items-center justify-between text-sm font-bold text-primary"
          >
            <span className="flex items-center gap-2 italic">
              خيارات المعالجة المتقدمة
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>

          {showAdvanced && (
            <div className="space-y-4 border-t border-border pt-2 animate-in fade-in slide-in-from-top-1">
              {/* خيارات توليد الأسئلة */}
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-bold text-slate-800">
                  تخصيص محتوى الأسئلة (عدد وأنواع)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      عدد الأسئلة المطلوب
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      المستوى المعرفي (بلوم)
                    </label>
                    <select
                      value={targetCognitiveLevel}
                      onChange={(e) => setTargetCognitiveLevel(e.target.value)}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      <option value="متنوع">متنوع (Default)</option>
                      <option value="تذكر">تذكر (سهل)</option>
                      <option value="فهم">فهم (متوسط)</option>
                      <option value="تطبيق">تطبيق (متوسط)</option>
                      <option value="تحليل">تحليل (صعب)</option>
                      <option value="تقييم">تقييم (مستويات عليا)</option>
                      <option value="إبداع">إبداع (مستويات عليا)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold">
                    الأنواع المطلوبة
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries({
                      mcq: 'اختيار من متعدد',
                      true_false: 'صح/خطأ',
                      fill_blank: 'ملء فراغ',
                      essay: 'مقالي',
                      correction: 'تصويب',
                    }).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={requestedTypes.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setRequestedTypes([...requestedTypes, key])
                            else
                              setRequestedTypes(
                                requestedTypes.filter((t) => t !== key)
                              )
                          }}
                          className="accent-primary"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">
                  نطاق الصفحات للـ PDF (اختياري)
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="مثال: 1-5, 10, 15-20"
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/30"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  اتركه فارغاً لمعالجة كافة الصفحات
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">
                  تعليمات إضافية للذكاء الاصطناعي (اختياري)
                </label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="مثال: ركز على أسئلة النحو، اجعل الأسئلة صعبة جداً وتتطلب استنتاجاً عميقاً، استهدف أفكار الدرس الفلاني..."
                  className="h-20 w-full resize-none rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/30"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  اكتب أي تعليمات إضافية وسيلتزم بها المحرك الذكي
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div>
                  <label className="block flex items-center gap-1 text-xs font-semibold text-indigo-950">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-600" />
                    أسئلة قائمة على قطع ونصوص مشتركة
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    تجميع الأسئلة حول قطع فهم، نصوص، أو قواعد نحوية
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={passageBased}
                  onChange={(e) => setPassageBased(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-semibold">
                    التجزئة التلقائية (Chunks)
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    تقسيم الملف لتفادي أعطال AI
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isChunked && (
                    <select
                      value={chunkSize}
                      onChange={(e) => setChunkSize(Number(e.target.value))}
                      className="rounded border border-border bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      <option value={2}>2 صفحة</option>
                      <option value={3}>3 صفحات</option>
                      <option value={5}>5 صفحات</option>
                      <option value={10}>10 صفحات</option>
                    </select>
                  )}
                  <input
                    type="checkbox"
                    checked={isChunked}
                    onChange={(e) => setIsChunked(e.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Processing Logs */}
        {(status === 'uploading' ||
          status === 'processing' ||
          processingLogs.length > 0) && (
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 font-mono">
            <h3 className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
              سجل العمليات (System Logs)
              {status === 'processing' && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </h3>
            <div className="scrollbar-thin max-h-40 space-y-2 overflow-y-auto pr-2">
              {processingLogs.length === 0 && (
                <p className="text-[10px] italic text-slate-600">
                  بدء الجلسة... بانتظار العمليات
                </p>
              )}
              {processingLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-2 text-[11px] duration-300 animate-in fade-in"
                >
                  <span className="shrink-0 text-slate-600">
                    [
                    {new Date().toLocaleTimeString('ar-EG', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                    ]
                  </span>
                  <span
                    className={` ${log.status === 'success' ? 'text-emerald-400' : ''} ${log.status === 'error' ? 'text-rose-400' : ''} ${log.status === 'loading' ? 'animate-pulse text-blue-400' : ''} ${log.status === 'info' ? 'text-slate-300' : ''} `}
                  >
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={status === 'uploading' || status === 'processing'}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-white shadow-sm transition-all hover:scale-[1.01] hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60"
        >
          {status === 'uploading' || status === 'processing' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> جاري المعالجة...
            </>
          ) : (
            <>
              <Brain className="h-5 w-5" /> توليد الأسئلة بالذكاء الاصطناعي
            </>
          )}
        </button>
      </div>

      {/* Sidebar - Settings */}
      <div className="space-y-4">
        <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <h3 className="text-base font-bold">إعدادات المحتوى</h3>
            {expertMsg && (
              <div className="flex animate-fade-in items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                {expertMsg}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              عنوان المحتوى *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: وحدة الجبر - الصف الثالث الثانوي"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              المادة الدراسية *
            </label>
            <div className="relative">
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">اختر المادة</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name_ar}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              الصف الدراسي *
            </label>
            <div className="relative">
              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">اختر الصف</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name_ar}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              الوحدة (اختياري)
            </label>
            <div className="relative">
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={units.length === 0}
                className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                <option value="">
                  {units.length > 0 ? 'اختر الوحدة' : 'اختر المادة والصف أولاً'}
                </option>
                {['term_1', 'term_2', 'full_year'].map((term) => {
                  const termUnits = units.filter(
                    (u) =>
                      u.semester === term ||
                      (!u.semester && term === 'full_year')
                  )
                  if (termUnits.length === 0) return null
                  const termLabels: any = {
                    term_1: 'الفصل الأول',
                    term_2: 'الفصل الثاني',
                    full_year: 'عام كامل',
                  }
                  return (
                    <optgroup key={term} label={termLabels[term]}>
                      {termUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name_ar}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {units.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                الدرس (اختياري)
              </label>
              <div className="relative">
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  disabled={lessons.length === 0}
                  className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                >
                  <option value="">
                    {lessons.length > 0 ? 'اختر الدرس' : 'اختر الوحدة أولاً'}
                  </option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name_ar}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h4 className="mb-3 text-sm font-bold text-blue-800">
            💡 نصائح لنتائج أفضل
          </h4>
          <ul className="space-y-2 text-xs leading-relaxed text-blue-700">
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
