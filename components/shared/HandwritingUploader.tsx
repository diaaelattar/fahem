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
async function compressImage(file: File, maxWidthPx = 1600, quality = 0.82): Promise<Blob> {
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null)
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
            className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowZoom(false)}
          >
            <button
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              onClick={() => setShowZoom(false)}
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="معاينة الإجابة"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="mt-3 relative group">
          <div className="relative rounded-2xl overflow-hidden border-2 border-green-400 bg-green-50 shadow-md">
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="إجابة مكتوبة بخط اليد"
              className="w-full max-h-64 object-contain cursor-zoom-in"
              onClick={() => setShowZoom(true)}
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setShowZoom(true)}
                className="bg-white/90 text-slate-800 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 hover:bg-white transition-colors shadow-lg"
              >
                <ZoomIn className="w-4 h-4" />
                تكبير
              </button>
              {!disabled && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary/90 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 hover:bg-primary transition-colors shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  استبدال
                </button>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              تم رفع الصورة بنجاح
            </span>
            {!disabled && (
              <button
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
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
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      </>
    )
  }

  // حالة الرفع
  if (uploading) {
    return (
      <div className="mt-3 border-2 border-dashed border-primary/40 rounded-2xl p-6 bg-primary/5 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-primary">جاري رفع الصورة...</p>
        <div className="w-full max-w-xs h-2 bg-primary/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
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
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-2xl p-5 bg-slate-50 hover:bg-primary/5 transition-all">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-bold text-slate-700 text-sm mb-1">أرفق صورة إجابتك الورقية</p>
            <p className="text-xs text-muted-foreground">اكتب الإجابة على ورقة، صوّرها، ثم ارفعها هنا</p>
          </div>

          <div className="flex gap-2 mt-1 w-full max-w-xs">
            {/* التقاط من الكاميرا */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Camera className="w-4 h-4" />
              التقاط صورة
            </button>

            {/* رفع من المعرض */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 border border-slate-200"
            >
              <Upload className="w-4 h-4" />
              من الجهاز
            </button>
          </div>

          <p className="text-xs text-muted-foreground/70">JPG, PNG, HEIC · حد أقصى 15 ميجابايت</p>
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
