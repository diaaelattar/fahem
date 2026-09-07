'use client'

// components/shared/DigitalDrawingPad.tsx
// لوحة كتابة ورسم رقمية مخصصة للطلاب (Digital Inking Canvas)
// تدعم اللمس والأقلام الضوئية (Stylus) مع مسطرة كراسة إجابة واقعية

import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Pen,
  Eraser,
  RotateCcw,
  Trash2,
  Check,
  X,
  Minus,
} from 'lucide-react'

interface DigitalDrawingPadProps {
  onSave: (blob: Blob) => void
  onCancel: () => void
}

interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
  color: string
  width: number
  isEraser: boolean
}

export function DigitalDrawingPad({ onSave, onCancel }: DigitalDrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [penColor, setPenColor] = useState<string>('#1B4F72') // أزرق رسمي
  const [lineWidth, setLineWidth] = useState<number>(3)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // ضبط أبعاد الـ Canvas مع الـ Container
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      redraw(strokes)
    }
  }, [strokes])

  useEffect(() => {
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [updateCanvasSize])

  // رسم أسطر كراسة الإجابة والخطوط
  const redraw = useCallback(
    (allStrokes: Stroke[]) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      // 1. مسح الخلفية باللون الأبيض
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)

      // 2. رسم تسطير كراسة الإجابة (Ruled notebook lines)
      ctx.strokeStyle = '#E2E8F0' // رمادي فاتح مسطر
      ctx.lineWidth = 1
      const lineGap = 32
      for (let y = lineGap; y < height; y += lineGap) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // 3. رسم كل الشخبطات / الخطوط
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      allStrokes.forEach((stroke) => {
        if (stroke.points.length < 2) return

        ctx.beginPath()
        ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color
        ctx.lineWidth = stroke.width

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        ctx.stroke()
      })
    },
    []
  )

  // التعامل مع أحداث اللمس والماوس بدقة
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt = getCoordinates(e)
    if (!pt) return

    setIsDrawing(true)
    const newStroke: Stroke = {
      points: [pt],
      color: penColor,
      width: tool === 'eraser' ? lineWidth * 4 : lineWidth,
      isEraser: tool === 'eraser',
    }
    setCurrentStroke(newStroke)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return
    e.preventDefault()
    const pt = getCoordinates(e)
    if (!pt) return

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, pt],
    }
    setCurrentStroke(updatedStroke)
    redraw([...strokes, updatedStroke])
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return
    e.preventDefault()
    setIsDrawing(false)
    const finalStrokes = [...strokes, currentStroke]
    setStrokes(finalStrokes)
    setCurrentStroke(null)
    redraw(finalStrokes)
  }

  // تراجع عن آخر خط (Undo)
  const handleUndo = () => {
    if (strokes.length === 0) return
    const updated = strokes.slice(0, -1)
    setStrokes(updated)
    redraw(updated)
  }

  // مسح الكل (Clear)
  const handleClear = () => {
    if (strokes.length === 0) return
    if (confirm('هل تريد مسح لوحة الرسم بالكامل؟')) {
      setStrokes([])
      redraw([])
    }
  }

  // تصدير كصورة Blob
  const handleConfirmSave = () => {
    const canvas = canvasRef.current
    if (!canvas || strokes.length === 0) {
      alert('لوحة الرسم فارغة، يرجى كتابة الإجابة أولاً')
      return
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob)
        }
      },
      'image/jpeg',
      0.88
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-white shadow-lg overflow-hidden animate-in fade-in duration-200">
      {/* شريط الأدوات العلوي */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-slate-50 p-3">
        {/* أدوات القلم والممحاة */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              tool === 'pen'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Pen className="h-3.5 w-3.5" />
            قلم
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              tool === 'eraser'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Eraser className="h-3.5 w-3.5" />
            ممحاة
          </button>

          {/* اختيار لون القلم */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
              {[
                { color: '#1B4F72', label: 'أزرق' },
                { color: '#1B2631', label: 'أسود' },
                { color: '#922B21', label: 'أحمر' },
                { color: '#1E8449', label: 'أخضر' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    penColor === c.color ? 'scale-125 ring-2 ring-primary ring-offset-1' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          {/* سمك الخط */}
          <div className="flex items-center gap-1 mr-2 border-r border-slate-200 pr-2">
            {[
              { width: 2, label: 'رفيع' },
              { width: 3.5, label: 'متوسط' },
              { width: 5.5, label: 'عريض' },
            ].map((s) => (
              <button
                type="button"
                key={s.width}
                onClick={() => setLineWidth(s.width)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${
                  lineWidth === s.width ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-600'
                }`}
                title={s.label}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: s.width * 2, height: s.width * 2 }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* أدوات التراجع والمسح */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            title="تراجع عن آخر خطوة"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            تراجع
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40"
            title="مسح الكل"
          >
            <Trash2 className="h-3.5 w-3.5" />
            مسح
          </button>
        </div>
      </div>

      {/* مساحة الرسم - كراسة إجابة مسطرة */}
      <div
        ref={containerRef}
        className="relative h-72 w-full touch-none select-none bg-white cursor-crosshair sm:h-96"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-0 h-full w-full"
        />
        {strokes.length === 0 && !isDrawing && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center opacity-40">
            <Pen className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-bold text-slate-600">اكتب إجابتك أو خطوات الحل هنا بيدك أو بالقلم</p>
            <p className="text-xs text-slate-400 mt-0.5">تدعم المسائل الرياضية والمعادلات والرسم الحر</p>
          </div>
        )}
      </div>

      {/* شريط الإجراءات السفلي */}
      <div className="flex items-center justify-between border-t border-border bg-slate-50 p-3">
        <span className="text-xs font-medium text-muted-foreground">
          {strokes.length > 0 ? `تم تسجيل ${strokes.length} حركة كتابة` : 'في انتظار الكتابة...'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <X className="h-3.5 w-3.5" />
            إلغاء
          </button>
          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={handleConfirmSave}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            اعتماد الإجابة الورقية
          </button>
        </div>
      </div>
    </div>
  )
}
