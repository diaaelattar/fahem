'use client'

// components/shared/HandwritingUploader.tsx
// مكوّن رفع وتحسين إجابات خط اليد والسبورة الرقمية
// يدعم: الكاميرا، رفع الصور، التدوير 90°، زيادة التباين للخط اليدوي، واللوحة الرقمية المباشرة

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Camera,
  Upload,
  X,
  ZoomIn,
  CheckCircle,
  Loader2,
  ImageIcon,
  RotateCw,
  Sun,
  PenTool,
  AlertCircle,
  Check,
} from 'lucide-react'
import { DigitalDrawingPad } from './DigitalDrawingPad'

interface HandwritingUploaderProps {
  questionId: string
  attemptId: string
  existingImageUrl?: string | null
  onImageUploaded: (imageUrl: string) => void
  onImageRemoved: () => void
  disabled?: boolean
}

// ضغط ومعالجة الصورة (تدوير / تباين / تصغير الحجم)
async function processAndCompressImage(
  source: File | Blob,
  rotationDegrees = 0,
  enhanceContrast = false,
  maxWidthPx = 1600,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(source)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      // تطبيق التدوير 90 أو 270 درجة يبدل العرض والارتفاع
      const isSideways = rotationDegrees % 180 !== 0
      if (isSideways) {
        [width, height] = [height, width]
      }

      // ضبط المقاس الأقصى
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width)
        width = maxWidthPx
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas context failed'))
        return
      }

      // تحريك وتدوير المحاور
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate((rotationDegrees * Math.PI) / 180)
      if (isSideways) {
        ctx.drawImage(img, -height / 2, -width / 2, height, width)
      } else {
        ctx.drawImage(img, -width / 2, -height / 2, width, height)
      }
      ctx.restore()

      // تحسين التباين (Contrast Boost) إذا طُلب
      if (enhanceContrast) {
        const imgData = ctx.getImageData(0, 0, width, height)
        const d = imgData.data
        const contrast = 35 // زيادة التباين لتغميق خط القلم الرصاص وتبييض الورقة
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

        for (let i = 0; i < d.length; i += 4) {
          d[i] = factor * (d[i] - 128) + 128     // R
          d[i + 1] = factor * (d[i + 1] - 128) + 128 // G
          d[i + 2] = factor * (d[i + 2] - 128) + 128 // B
        }
        ctx.putImageData(imgData, 0, 0)
      }

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

export function HandwritingUploader({
  questionId,
  attemptId,
  existingImageUrl,
  onImageUploaded,
  onImageRemoved,
  disabled = false,
}: HandwritingUploaderProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // الحالات
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null)
  const [showZoom, setShowZoom] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // وضع التعديل قبل الرفع
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [stagedPreview, setStagedPreview] = useState<string | null>(null)
  const [rotation, setRotation] = useState<number>(0)
  const [contrastBoost, setContrastBoost] = useState<boolean>(false)

  // وضع لوحة الرسم الرقمية المباشرة
  const [showDrawingPad, setShowDrawingPad] = useState<boolean>(false)

  // إرسال الـ Blob النهائي لسحابة التخزين
  const uploadBlobToStorage = useCallback(
    async (blob: Blob) => {
      setError(null)
      setUploading(true)
      setUploadProgress(15)

      try {
        const filePath = `${attemptId}/${questionId}_${Date.now()}.jpg`
        setUploadProgress(45)

        const { data, error: uploadError } = await supabase.storage
          .from('student-answers-images')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (uploadError) throw uploadError

        setUploadProgress(85)

        const { data: urlData } = supabase.storage
          .from('student-answers-images')
          .getPublicUrl(data.path)

        setUploadProgress(100)
        setPreviewUrl(urlData.publicUrl)
        onImageUploaded(urlData.publicUrl)

        // تنظيف الحالة المؤقتة
        setStagedFile(null)
        if (stagedPreview) URL.revokeObjectURL(stagedPreview)
        setStagedPreview(null)
        setRotation(0)
        setContrastBoost(false)
      } catch (err: unknown) {
        console.error('Upload error:', err)
        const msg = err instanceof Error ? err.message : 'فشل رفع الصورة'
        setError(`${msg}. تحقق من الاتصال بالإنترنت وحاول مجدداً.`)
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [attemptId, questionId, supabase, onImageUploaded, stagedPreview]
  )

  // عند اختيار صورة من الكاميرا أو الجهاز
  const handleFilePicked = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (JPG, PNG, HEIC)')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('حجم الصورة كبير جداً. الحد الأقصى 15 ميجابايت')
      return
    }

    setError(null)
    setStagedFile(file)
    setRotation(0)
    setContrastBoost(false)
    const localUrl = URL.createObjectURL(file)
    setStagedPreview(localUrl)
  }

  // تدوير الصورة 90 درجة يميناً
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  // تأكيد رفع الصورة المعدلة
  const handleConfirmStagedUpload = async () => {
    if (!stagedFile) return
    try {
      setUploading(true)
      const processedBlob = await processAndCompressImage(
        stagedFile,
        rotation,
        contrastBoost
      )
      await uploadBlobToStorage(processedBlob)
    } catch (err: unknown) {
      setError('فشلت معالجة الصورة، يرجى المحاولة مجدداً')
      setUploading(false)
    }
  }

  // إلغاء تجهيز الصورة
  const handleCancelStaged = () => {
    setStagedFile(null)
    if (stagedPreview) URL.revokeObjectURL(stagedPreview)
    setStagedPreview(null)
    setRotation(0)
    setContrastBoost(false)
  }

  // استلام إجابة مرسومة من DigitalDrawingPad
  const handleDrawingPadSaved = async (blob: Blob) => {
    setShowDrawingPad(false)
    await uploadBlobToStorage(blob)
  }

  // حذف الصورة الحالية
  const handleRemove = () => {
    setPreviewUrl(null)
    setError(null)
    onImageRemoved()
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  // 1. عرض لوحة الرسم الرقمي
  if (showDrawingPad) {
    return (
      <div className="mt-3">
        <DigitalDrawingPad
          onSave={handleDrawingPadSaved}
          onCancel={() => setShowDrawingPad(false)}
        />
      </div>
    )
  }

  // 2. عرض الصورة المعتمدة والمرفوعة بالفعل
  if (previewUrl) {
    return (
      <>
        {showZoom && (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowZoom(false)}
          >
            <button
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              onClick={() => setShowZoom(false)}
            >
              <X className="h-6 w-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="معاينة الإجابة"
              className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        )}

        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-slate-50 p-4">
          <div className="relative overflow-hidden rounded-xl border border-border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="إجابتك المكتوبة"
              className="max-h-72 w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setShowZoom(true)}
              className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-sm hover:bg-black/85"
            >
              <ZoomIn className="h-3.5 w-3.5" />
              تكبير الصورة
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              تم حفظ الإجابة بنجاح
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 text-xs font-bold text-rose-500 transition-colors hover:text-rose-700"
              >
                <X className="h-3.5 w-3.5" />
                حذف وإعادة الحل
              </button>
            )}
          </div>
        </div>
      </>
    )
  }

  // 3. شاشة فحص وضبط الصورة قبل اعتماد الرفع (Preview & Adjust)
  if (stagedFile && stagedPreview) {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in duration-150">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">
            تأكد من وضوح الصورة وتدويرها الصحيح قبل الإرسال:
          </p>
          <button
            type="button"
            onClick={handleCancelStaged}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* مساحة المعاينة التفاعلية */}
        <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stagedPreview}
            alt="معاينة قبل الرفع"
            className="max-h-full max-w-full object-contain transition-all duration-300"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: contrastBoost ? 'contrast(135%) brightness(105%)' : 'none',
            }}
          />
        </div>

        {/* أشرطة التحكم السريعة */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-primary/10 pt-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100"
              title="تدوير الصورة 90 درجة"
            >
              <RotateCw className="h-3.5 w-3.5 text-primary" />
              تدوير الصورة
            </button>

            <button
              type="button"
              onClick={() => setContrastBoost(!contrastBoost)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold shadow-sm transition-colors ${
                contrastBoost
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
              title="تغميق خط القلم وتبييض الورقة"
            >
              <Sun className="h-3.5 w-3.5" />
              {contrastBoost ? 'تم توضيح الخط ✓' : 'توضيح الخط'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelStaged}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={handleConfirmStagedUpload}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              تأكيد واعتماد الإجابة
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 4. حالة جاري الرفع
  if (uploading) {
    return (
      <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-primary">جارٍ رفع ومعالجة صورة الإجابة...</p>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-primary/20">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      </div>
    )
  }

  // 5. الحالة الافتراضية: اختيار طريقة الإجابة اليدوية
  return (
    <div className="mt-3 space-y-2">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 transition-all hover:border-primary/50 hover:bg-primary/5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-slate-800">
              أرفق إجابتك بخط اليد أو بالرسم
            </p>
            <p className="text-xs text-muted-foreground">
              اختر الطريقة الأنسب لك لحل السؤال المقالي أو المسألة
            </p>
          </div>

          <div className="mt-1 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-3">
            {/* التقاط بالكاميرا */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              تصوير ورقة
            </button>

            {/* رفع من المعرض */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              من المعرض
            </button>

            {/* سبورة رقمية مباشرة */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowDrawingPad(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 disabled:opacity-50"
            >
              <PenTool className="h-4 w-4" />
              سبورة رسم
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground/70">
            تدعم التدوير والتوضيح التلقائي للخط · حد أقصى 15 ميجابايت
          </p>
        </div>
      </div>

      {/* Inputs المخفية */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFilePicked(e.target.files[0])}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFilePicked(e.target.files[0])}
      />
    </div>
  )
}
