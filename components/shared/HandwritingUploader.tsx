'use client'

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
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

interface HandwritingUploaderProps {
  questionId: string
  attemptId: string
  existingImageUrl?: string | null
  onImageUploaded: (imageUrl: string) => void
  onImageRemoved: () => void
  disabled?: boolean
}

// ضغط الصورة قبل الرفع لتقليل الحجم
async function compressImage(
  file: File,
  maxWidthPx = 1600,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width)
        width = maxWidthPx
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality)
      URL.revokeObjectURL(url)
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

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingImageUrl || null
  )
  const [showZoom, setShowZoom] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('يرجى اختيار ملف صورة صالح (JPG, PNG, HEIC)')
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً. الحد الأقصى 15 ميجابايت')
        return
      }

      setError(null)
      setUploading(true)
      setUploadProgress(10)

      try {
        // عرض معاينة فورية
        const localUrl = URL.createObjectURL(file)
        setPreviewUrl(localUrl)
        setUploadProgress(20)

        // ضغط الصورة
        const compressed = await compressImage(file)
        setUploadProgress(40)

        // رفع إلى Supabase Storage
        const filePath = `${attemptId}/${questionId}_${Date.now()}.jpg`
        const { data, error: uploadError } = await supabase.storage
          .from('student-answers-images')
          .upload(filePath, compressed, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        setUploadProgress(80)

        if (uploadError) throw uploadError

        // جلب الرابط العام
        const { data: urlData } = supabase.storage
          .from('student-answers-images')
          .getPublicUrl(data.path)

        setUploadProgress(100)
        setPreviewUrl(urlData.publicUrl)
        onImageUploaded(urlData.publicUrl)
        URL.revokeObjectURL(localUrl)
      } catch (err: any) {
        console.error('Upload error:', err)
        setError('فشل رفع الصورة. تحقق من اتصال الإنترنت وحاول مجدداً.')
        setPreviewUrl(existingImageUrl || null)
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [attemptId, questionId, supabase, onImageUploaded, existingImageUrl]
  )

  const handleRemove = () => {
    setPreviewUrl(null)
    setError(null)
    onImageRemoved()
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  // إذا كانت الصورة موجودة بالفعل
  if (previewUrl) {
    return (
      <>
        {/* Zoom Modal */}
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
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="group relative mt-3">
          <div className="relative overflow-hidden rounded-2xl border-2 border-green-400 bg-green-50 shadow-md">
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="إجابة مكتوبة بخط اليد"
              className="max-h-64 w-full cursor-zoom-in object-contain"
              onClick={() => setShowZoom(true)}
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
              <button
                onClick={() => setShowZoom(true)}
                className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-sm font-bold text-slate-800 shadow-lg transition-colors hover:bg-white"
              >
                <ZoomIn className="h-4 w-4" />
                تكبير
              </button>
              {!disabled && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/90 px-3 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-primary"
                >
                  <RefreshCw className="h-4 w-4" />
                  استبدال
                </button>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" />
              تم رفع الصورة بنجاح
            </span>
            {!disabled && (
              <button
                onClick={handleRemove}
                className="flex items-center gap-1 text-xs font-medium text-red-500 transition-colors hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" />
                حذف
              </button>
            )}
          </div>

          {/* Hidden replace input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
          />
        </div>
      </>
    )
  }

  // حالة الرفع
  if (uploading) {
    return (
      <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-primary">جاري رفع الصورة...</p>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-primary/20">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
      </div>
    )
  }

  // حالة الاختيار
  return (
    <div className="mt-3 space-y-2">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 transition-all hover:border-primary/50 hover:bg-primary/5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-slate-700">
              أرفق صورة إجابتك الورقية
            </p>
            <p className="text-xs text-muted-foreground">
              اكتب الإجابة على ورقة، صوّرها، ثم ارفعها هنا
            </p>
          </div>

          <div className="mt-1 flex w-full max-w-xs gap-2">
            {/* التقاط من الكاميرا */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              التقاط صورة
            </button>

            {/* رفع من المعرض */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              من الجهاز
            </button>
          </div>

          <p className="text-xs text-muted-foreground/70">
            JPG, PNG, HEIC · حد أقصى 15 ميجابايت
          </p>
        </div>
      </div>

      {/* Camera input - يفتح الكاميرا مباشرة على الموبايل */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* File picker - يفتح معرض الصور */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  )
}
