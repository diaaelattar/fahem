'use client'

import { useState, useRef } from 'react'
import { X, Undo, Trash2, Plus, Eye, CheckCircle2, ChevronRight, Sliders, Type, Grid } from 'lucide-react'
import { toast } from 'sonner'

interface Shape {
  id: string
  type: 'circle' | 'rect' | 'triangle' | 'axes' | 'line' | 'angle' | 'text'
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  cx?: number
  cy?: number
  r?: number
  width?: number
  height?: number
  points?: string // For triangle: "x1,y1 x2,y2 x3,y3"
  text?: string
  color: string
  fillColor: string
  strokeWidth: number
  isDashed: boolean
  hasArrow?: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onInsert: (svgString: string) => void
}

export function GeometricShapeBuilder({ isOpen, onClose, onInsert }: Props) {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [history, setHistory] = useState<Shape[][]>([])
  
  // Current Tool configuration
  const [activeTool, setActiveTool] = useState<Shape['type']>('circle')
  const [strokeColor, setStrokeColor] = useState('#2563eb') // blue-600
  const [fillColor, setFillColor] = useState('transparent')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isDashed, setIsDashed] = useState(false)
  const [hasArrow, setHasArrow] = useState(false)

  // Shape specific parameters
  const [circleRadius, setCircleRadius] = useState(50)
  const [rectWidth, setRectWidth] = useState(80)
  const [rectHeight, setRectHeight] = useState(60)
  const [lineLength, setLineLength] = useState(100)
  const [labelText, setLabelText] = useState('A')
  const [triangleType, setTriangleType] = useState<'right' | 'isosceles'>('right')

  // Mouse/interaction states
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<SVGSVGElement>(null)

  if (!isOpen) return null

  // Save state to history for undo
  const saveState = (newShapes: Shape[]) => {
    setHistory(prev => [...prev, shapes])
    setShapes(newShapes)
  }

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1]
      setShapes(prev)
      setHistory(prevHistory => prevHistory.slice(0, -1))
    }
  }

  const handleClear = () => {
    saveState([])
  }

  // Add standard shapes
  const handleAddShape = () => {
    const id = `shape-${Date.now()}`
    let newShape: Shape

    // Coordinates in the center of 400x400 canvas
    const cx = 200
    const cy = 200

    switch (activeTool) {
      case 'circle':
        newShape = {
          id,
          type: 'circle',
          cx,
          cy,
          r: circleRadius,
          color: strokeColor,
          fillColor,
          strokeWidth,
          isDashed,
        }
        break
      case 'rect':
        newShape = {
          id,
          type: 'rect',
          x1: cx - rectWidth / 2,
          y1: cy - rectHeight / 2,
          width: rectWidth,
          height: rectHeight,
          color: strokeColor,
          fillColor,
          strokeWidth,
          isDashed,
        }
        break
      case 'triangle':
        // Generate triangle points relative to center
        let pts = ''
        if (triangleType === 'right') {
          // Right triangle (A, B, C)
          pts = `${cx - 40},${cy + 40} ${cx + 40},${cy + 40} ${cx - 40},${cy - 40}`
        } else {
          // Isosceles
          pts = `${cx},${cy - 50} ${cx - 50},${cy + 40} ${cx + 50},${cy + 40}`
        }
        newShape = {
          id,
          type: 'triangle',
          points: pts,
          color: strokeColor,
          fillColor,
          strokeWidth,
          isDashed,
        }
        break
      case 'line':
        newShape = {
          id,
          type: 'line',
          x1: cx - lineLength / 2,
          y1: cy,
          x2: cx + lineLength / 2,
          y2: cy,
          color: strokeColor,
          fillColor: 'none',
          strokeWidth,
          isDashed,
          hasArrow,
        }
        break
      case 'axes':
        // Grid/axes span the whole canvas
        newShape = {
          id,
          type: 'axes',
          color: '#94a3b8', // slate-400
          fillColor: 'none',
          strokeWidth: 1.5,
          isDashed: false,
        }
        break
      case 'text':
        newShape = {
          id,
          type: 'text',
          x1: cx,
          y1: cy,
          text: labelText,
          color: strokeColor,
          fillColor: 'none',
          strokeWidth: 1,
          isDashed: false,
        }
        break
      default:
        return
    }

    saveState([...shapes, newShape])
  }

  // Handle Dragging elements on SVG canvas
  const handleMouseDown = (e: React.MouseEvent, shape: Shape) => {
    e.preventDefault()
    setDraggedShapeId(shape.id)
    
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (shape.type === 'circle') {
      setDragOffset({ x: x - (shape.cx || 0), y: y - (shape.cy || 0) })
    } else if (shape.type === 'rect' || shape.type === 'text') {
      setDragOffset({ x: x - (shape.x1 || 0), y: y - (shape.y1 || 0) })
    } else if (shape.type === 'line') {
      setDragOffset({ x: x - (shape.x1 || 0), y: y - (shape.y1 || 0) })
    } else if (shape.type === 'triangle') {
      // Find average point for offset
      const pts = (shape.points || '').split(' ').map(p => p.split(',').map(Number))
      const avgX = pts.reduce((s, p) => s + p[0], 0) / pts.length
      const avgY = pts.reduce((s, p) => s + p[1], 0) / pts.length
      setDragOffset({ x: x - avgX, y: y - avgY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedShapeId || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setShapes(prev => prev.map(s => {
      if (s.id !== draggedShapeId) return s

      if (s.type === 'circle') {
        return { ...s, cx: x - dragOffset.x, cy: y - dragOffset.y }
      } else if (s.type === 'rect' || s.type === 'text') {
        return { ...s, x1: x - dragOffset.x, y1: y - dragOffset.y }
      } else if (s.type === 'line') {
        const dx = (s.x2 || 0) - (s.x1 || 0)
        const dy = (s.y2 || 0) - (s.y1 || 0)
        const nx1 = x - dragOffset.x
        const ny1 = y - dragOffset.y
        return { ...s, x1: nx1, y1: ny1, x2: nx1 + dx, y2: ny1 + dy }
      } else if (s.type === 'triangle') {
        const pts = (s.points || '').split(' ').map(p => p.split(',').map(Number))
        const avgX = pts.reduce((s, p) => s + p[0], 0) / pts.length
        const avgY = pts.reduce((s, p) => s + p[1], 0) / pts.length
        const dx = x - dragOffset.x - avgX
        const dy = y - dragOffset.y - avgY

        const newPts = pts.map(p => `${p[0] + dx},${p[1] + dy}`).join(' ')
        return { ...s, points: newPts }
      }
      return s
    }))
  }

  const handleMouseUp = () => {
    setDraggedShapeId(null)
  }

  // Compile final SVG string to inject
  const handleInsertSvg = () => {
    if (shapes.length === 0) {
      toast.error('لا يمكن إدراج رسم فارغ.')
      return
    }

    let innerContent = ''
    
    // Add arrow markers definitions if any vector line has arrow
    const hasArrowInShapes = shapes.some(s => s.hasArrow)
    if (hasArrowInShapes) {
      innerContent += '  <defs>\n    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />\n    </marker>\n  </defs>\n'
    }

    shapes.forEach(s => {
      const strokeDash = s.isDashed ? ' stroke-dasharray="4 4"' : ''
      const fill = s.fillColor === 'transparent' ? 'none' : s.fillColor

      if (s.type === 'circle') {
        innerContent += `  <circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" stroke="${s.color}" stroke-width="${s.strokeWidth}" fill="${fill}"${strokeDash} />\n`
      } else if (s.type === 'rect') {
        innerContent += `  <rect x="${s.x1}" y="${s.y1}" width="${s.width}" height="${s.height}" stroke="${s.color}" stroke-width="${s.strokeWidth}" fill="${fill}"${strokeDash} />\n`
      } else if (s.type === 'triangle') {
        innerContent += `  <polygon points="${s.points}" stroke="${s.color}" stroke-width="${s.strokeWidth}" fill="${fill}"${strokeDash} />\n`
      } else if (s.type === 'line') {
        const marker = s.hasArrow ? ' marker-end="url(#arrow)"' : ''
        innerContent += `  <line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${s.color}" stroke-width="${s.strokeWidth}"${strokeDash}${marker} />\n`
      } else if (s.type === 'axes') {
        // Grid lines
        for (let gridVal = 40; gridVal < 400; gridVal += 40) {
          innerContent += `  <line x1="${gridVal}" y1="0" x2="${gridVal}" y2="400" stroke="#f1f5f9" stroke-width="1" />\n`
          innerContent += `  <line x1="0" y1="${gridVal}" x2="400" y2="${gridVal}" stroke="#f1f5f9" stroke-width="1" />\n`
        }
        // Axes lines
        innerContent += `  <line x1="200" y1="10" x2="200" y2="390" stroke="#94a3b8" stroke-width="2" />\n` // Y axis
        innerContent += `  <line x1="10" y1="200" x2="390" y2="200" stroke="#94a3b8" stroke-width="2" />\n` // X axis
        // Ticks
        for (let tick = 40; tick < 400; tick += 40) {
          if (tick === 200) continue
          innerContent += `  <line x1="${tick}" y1="195" x2="${tick}" y2="205" stroke="#94a3b8" stroke-width="1.5" />\n`
          innerContent += `  <line x1="195" y1="${tick}" x2="205" y2="${tick}" stroke="#94a3b8" stroke-width="1.5" />\n`
        }
      } else if (s.type === 'text') {
        innerContent += `  <text x="${s.x1}" y="${s.y1}" fill="${s.color}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${s.text}</text>\n`
      }
    })

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="mx-auto my-4 max-w-xs md:max-w-sm rounded-xl border border-slate-100 bg-slate-50/20 shadow-sm" style="aspect-ratio: 1/1; display: block;">\n${innerContent}</svg>`
    
    onInsert(svgString)
    toast.success('تم إدراج الرسم الهندسي SVG بنجاح!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div
        className="flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">محرر الرسوم الهندسية التفاعلي</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ارسم الأشكال والدوائر والمحاور والخطوط الهندسية، وقم بسحبها وضبطها، ثم أدرج كود SVG داخل السؤال
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Right Sidebar: controls */}
          <div className="w-full md:w-80 border-l border-slate-100 bg-slate-50/50 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Select Tool */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">اختر الشكل</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'circle', label: 'دائرة' },
                    { type: 'rect', label: 'مستطيل' },
                    { type: 'triangle', label: 'مثلث' },
                    { type: 'line', label: 'خط/متجه' },
                    { type: 'axes', label: 'محاور' },
                    { type: 'text', label: 'نص/تسمية' },
                  ].map(t => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setActiveTool(t.type as any)}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${activeTool === t.type ? 'border-primary bg-primary text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-primary/30'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Parameter Settings */}
              <div className="space-y-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <span className="text-xs font-bold text-slate-700 block border-b pb-1.5 mb-2">إعدادات الشكل</span>
                
                {activeTool === 'circle' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>نصف القطر:</span>
                      <span>{circleRadius} px</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={150}
                      value={circleRadius}
                      onChange={e => setCircleRadius(parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                )}

                {activeTool === 'rect' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>العرض:</span>
                        <span>{rectWidth} px</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={200}
                        value={rectWidth}
                        onChange={e => setRectWidth(parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>الارتفاع:</span>
                        <span>{rectHeight} px</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={200}
                        value={rectHeight}
                        onChange={e => setRectHeight(parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                )}

                {activeTool === 'triangle' && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-600 block">نوع المثلث:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTriangleType('right')}
                        className={`flex-1 py-1 px-2.5 text-xs font-semibold rounded-lg border ${triangleType === 'right' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200'}`}
                      >
                        قائم الزاوية
                      </button>
                      <button
                        onClick={() => setTriangleType('isosceles')}
                        className={`flex-1 py-1 px-2.5 text-xs font-semibold rounded-lg border ${triangleType === 'isosceles' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200'}`}
                      >
                        متساوي الساقين
                      </button>
                    </div>
                  </div>
                )}

                {activeTool === 'line' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>طول الخط:</span>
                        <span>{lineLength} px</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={300}
                        value={lineLength}
                        onChange={e => setLineLength(parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="has-arrow-check"
                        checked={hasArrow}
                        onChange={e => setHasArrow(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <label htmlFor="has-arrow-check" className="text-xs font-semibold text-slate-600 cursor-pointer">
                        إضافة رأس متجه (سهم)
                      </label>
                    </div>
                  </div>
                )}

                {activeTool === 'text' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">النص / التسمية الهندسية (مثال: A، B، x، 5cm):</label>
                    <input
                      type="text"
                      value={labelText}
                      onChange={e => setLabelText(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                )}

                {activeTool === 'axes' && (
                  <p className="text-[11px] text-slate-400">
                    سيتم رسم شبكة محاور إحداثية تعامدية (X & Y Axis) في منتصف الشاشة مع خطوط تقسيمات فرعية.
                  </p>
                )}
              </div>

              {/* Stroke & Style Configuration */}
              <div className="space-y-4 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-700 block border-b pb-1.5 mb-2">تنسيق الشكل</span>
                
                {/* Stroke Color */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">اللون الخارجي</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['#2563eb', '#16a34a', '#dc2626', '#d97706', '#4f46e5', '#0f172a'].map(c => (
                      <button
                        key={c}
                        onClick={() => setStrokeColor(c)}
                        style={{ backgroundColor: c }}
                        className={`h-6 w-6 rounded-full border-2 transition-all ${strokeColor === c ? 'border-white ring-2 ring-primary scale-110 shadow-md' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Fill Color */}
                {activeTool !== 'line' && activeTool !== 'axes' && activeTool !== 'text' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">لون التعبئة</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setFillColor('transparent')}
                        className={`h-6 w-6 rounded-full border border-slate-300 bg-white relative overflow-hidden transition-all ${fillColor === 'transparent' ? 'ring-2 ring-primary scale-110 shadow-md' : ''}`}
                        title="شفاف"
                      >
                        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-red-500 rotate-45" />
                      </button>
                      {['#dbeafe', '#dcfce7', '#fee2e2', '#fef3c7', '#e0e7ff', '#f1f5f9'].map(c => (
                        <button
                          key={c}
                          onClick={() => setFillColor(c)}
                          style={{ backgroundColor: c }}
                          className={`h-6 w-6 rounded-full border-2 transition-all ${fillColor === c ? 'border-white ring-2 ring-primary scale-110 shadow-md' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Width & Line Style */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>سمك الخط:</span>
                    <span>{strokeWidth} px</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={strokeWidth}
                    onChange={e => setStrokeWidth(parseInt(e.target.value))}
                    className="w-full accent-primary"
                  />
                  
                  {activeTool !== 'text' && (
                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="is-dashed-check"
                        checked={isDashed}
                        onChange={e => setIsDashed(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <label htmlFor="is-dashed-check" className="text-xs font-semibold text-slate-600 cursor-pointer">
                        خط متقطع (Dotted Line)
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Add shape button */}
              <button
                type="button"
                onClick={handleAddShape}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-bold text-white shadow-md hover:bg-primary/95 transition-all"
              >
                <Plus className="h-4 w-4" /> إضافة الشكل للوحة
              </button>
            </div>

            {/* Utility undo/clear */}
            <div className="flex gap-2 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
              >
                <Undo className="h-3.5 w-3.5" /> تراجع
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={shapes.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 py-2 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> مسح اللوحة
              </button>
            </div>
          </div>

          {/* Left Main View: Interactive SVG Canvas */}
          <div className="flex-1 bg-slate-100 p-6 flex items-center justify-center relative select-none">
            {/* Guide grid helper under canvas */}
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm flex items-center gap-1">
              <Grid className="h-3.5 w-3.5" />
              <span>يمكنك الضغط وسحب الأشكال لتعديل موضعها</span>
            </div>

            <div className="relative aspect-square w-full max-w-[400px] rounded-3xl bg-white shadow-lg border border-slate-200 overflow-hidden">
              <svg
                ref={canvasRef}
                viewBox="0 0 400 400"
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Arrow markers for vector display on canvas */}
                <defs>
                  <marker
                    id="arrow-preview"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
                  </marker>
                </defs>

                {/* Render grid/axes under other shapes if axes exists */}
                {shapes.filter(s => s.type === 'axes').map(s => {
                  const items = []
                  // grid lines
                  for (let val = 40; val < 400; val += 40) {
                    items.push(<line key={`gx-${val}`} x1={val} y1="0" x2={val} y2="400" stroke="#f8fafc" strokeWidth="1" />)
                    items.push(<line key={`gy-${val}`} x1="0" y1={val} x2="400" y2={val} stroke="#f8fafc" strokeWidth="1" />)
                  }
                  // axes lines
                  items.push(<line key="axis-y" x1="200" y1="10" x2="200" y2="390" stroke="#94a3b8" strokeWidth="2" />)
                  items.push(<line key="axis-x" x1="10" y1="200" x2="390" y2="200" stroke="#94a3b8" strokeWidth="2" />)
                  // ticks
                  for (let tick = 40; tick < 400; tick += 40) {
                    if (tick === 200) continue
                    items.push(<line key={`tx-${tick}`} x1={tick} y1="195" x2={tick} y2="205" stroke="#94a3b8" strokeWidth="1.5" />)
                    items.push(<line key={`ty-${tick}`} x1="195" y1={tick} x2="205" y2={tick} stroke="#94a3b8" strokeWidth="1.5" />)
                  }
                  return <g key={s.id}>{items}</g>
                })}

                {/* Render normal shapes */}
                {shapes.filter(s => s.type !== 'axes').map(s => {
                  const dash = s.isDashed ? '4,4' : undefined
                  const fill = s.fillColor === 'transparent' ? 'none' : s.fillColor

                  const groupProps = {
                    key: s.id,
                    className: 'cursor-move',
                    onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, s)
                  }

                  if (s.type === 'circle') {
                    return (
                      <g {...groupProps}>
                        <circle cx={s.cx} cy={s.cy} r={s.r} stroke={s.color} strokeWidth={s.strokeWidth} fill={fill} strokeDasharray={dash} />
                        {/* Interactive small center dot */}
                        <circle cx={s.cx} cy={s.cy} r="3" fill={s.color} />
                      </g>
                    )
                  } else if (s.type === 'rect') {
                    return (
                      <g {...groupProps}>
                        <rect x={s.x1} y={s.y1} width={s.width} height={s.height} stroke={s.color} strokeWidth={s.strokeWidth} fill={fill} strokeDasharray={dash} />
                      </g>
                    )
                  } else if (s.type === 'triangle') {
                    return (
                      <g {...groupProps}>
                        <polygon points={s.points} stroke={s.color} strokeWidth={s.strokeWidth} fill={fill} strokeDasharray={dash} />
                      </g>
                    )
                  } else if (s.type === 'line') {
                    const marker = s.hasArrow ? 'url(#arrow-preview)' : undefined
                    return (
                      <g {...groupProps}>
                        <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={s.strokeWidth} strokeDasharray={dash} markerEnd={marker} />
                        <circle cx={s.x1} cy={s.y1} r="3" fill={s.color} />
                        <circle cx={s.x2} cy={s.y2} r="3" fill={s.color} />
                      </g>
                    )
                  } else if (s.type === 'text') {
                    return (
                      <g {...groupProps}>
                        <text x={s.x1} y={s.y1} fill={s.color} fontFamily="Arial, sans-serif" fontSize="15" fontWeight="bold" dominantBaseline="middle" textAnchor="middle">
                          {s.text}
                        </text>
                      </g>
                    )
                  }
                  return null
                })}

                {/* Show helper text if canvas is empty */}
                {shapes.length === 0 && (
                  <text x="200" y="200" fill="#94a3b8" textAnchor="middle" fontSize="14" fontFamily="sans-serif">
                    لوحة الرسم فارغة. اختر شكلاً واضغط إضافة.
                  </text>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={shapes.length === 0}
            onClick={handleInsertSvg}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary/95 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            إدراج الرسم في السؤال
          </button>
        </div>
      </div>
    </div>
  )
}
