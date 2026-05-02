'use client'

// components/student/CertificateCard.tsx
// بطاقة شهادة قابلة للطباعة

import { Award, Calendar, BookOpen, Star, Printer } from 'lucide-react'

interface CertificateCardProps {
  studentName: string
  examTitle: string
  subjectName: string
  gradeName: string
  score: number
  percentage: number
  completedAt: string
  attemptId: string
}

export function CertificateCard({
  studentName,
  examTitle,
  subjectName,
  gradeName,
  score,
  percentage,
  completedAt,
  attemptId,
}: CertificateCardProps) {
  const formattedDate = new Date(completedAt).toLocaleDateString('ar-EG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: 'ممتاز', color: 'text-green-600' }
    if (pct >= 80) return { label: 'جيد جداً', color: 'text-blue-600' }
    if (pct >= 70) return { label: 'جيد', color: 'text-yellow-600' }
    return { label: 'مقبول', color: 'text-orange-600' }
  }

  const grade = getGrade(percentage)

  const handlePrint = () => {
    const printContent = document.getElementById(`cert-${attemptId}`)
    if (!printContent) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>شهادة إنجاز — ${studentName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; background: white; }
          .cert { width: 210mm; min-height: 148mm; padding: 20mm; background: white; }
          .border-outer { border: 12px double #1B4F72; padding: 6mm; }
          .border-inner { border: 3px solid #C5A028; padding: 10mm; text-align: center; }
          .title { font-size: 36px; color: #1B4F72; font-weight: 900; margin-bottom: 8px; }
          .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
          .name { font-size: 28px; color: #C5A028; font-weight: 700; margin: 16px 0; border-bottom: 2px solid #C5A028; padding-bottom: 8px; display: inline-block; min-width: 60%; }
          .exam { font-size: 20px; color: #1B4F72; margin: 12px 0; }
          .score { font-size: 48px; color: #1B4F72; font-weight: 900; }
          .grade-label { font-size: 24px; color: #27ae60; font-weight: 700; }
          .details { display: flex; justify-content: center; gap: 40px; margin-top: 20px; font-size: 14px; color: #555; }
          .footer { margin-top: 20px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="cert">
          <div class="border-outer">
            <div class="border-inner">
              <div style="font-size:48px; margin-bottom:8px;">🏆</div>
              <div class="title">شهادة إنجاز</div>
              <div class="subtitle">منصة استباق مصر التعليمية</div>
              <div style="margin: 12px 0; color: #555; font-size: 16px;">يُشهد بأن الطالب/الطالبة</div>
              <div class="name">${studentName}</div>
              <div class="exam">قد أجتاز بنجاح اختبار</div>
              <div class="exam" style="font-weight: 700;">${examTitle}</div>
              <div style="margin: 8px 0; color: #666;">${subjectName} • ${gradeName}</div>
              <div class="score">${percentage.toFixed(0)}٪</div>
              <div class="grade-label">${getGrade(percentage).label}</div>
              <div class="details">
                <span>📅 ${formattedDate}</span>
              </div>
              <div class="footer">استباق مصر — منصة تعليمية متكاملة</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  return (
    <div
      id={`cert-${attemptId}`}
      className="relative bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-primary/20"
    >
      {/* الخلفية المزخرفة */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #1B4F72 0, #1B4F72 1px, transparent 0, transparent 50%)',
          backgroundSize: '10px 10px',
        }}
      />

      {/* إطار ذهبي داخلي */}
      <div className="m-3 rounded-2xl border-2 border-egypt-gold/50">
        <div className="p-8 text-center relative">

          {/* الأيقونة */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Award className="w-11 h-11 text-white" />
          </div>

          {/* العنوان */}
          <div className="text-xs uppercase tracking-[4px] text-muted-foreground mb-1">شهادة إنجاز</div>
          <h2 className="text-2xl font-bold text-primary mb-1">منصة استباق مصر</h2>

          {/* اسم الطالب */}
          <div className="my-5">
            <p className="text-sm text-muted-foreground mb-2">يُشهد بأن الطالب/الطالبة</p>
            <div className="inline-block border-b-2 border-egypt-gold pb-1 px-8">
              <p className="text-2xl font-bold text-foreground">{studentName}</p>
            </div>
          </div>

          {/* الاختبار */}
          <p className="text-sm text-muted-foreground mb-1">قد اجتاز بنجاح اختبار</p>
          <p className="text-xl font-bold text-primary mb-1">{examTitle}</p>
          <p className="text-sm text-muted-foreground">{subjectName} • {gradeName}</p>

          {/* الدرجة */}
          <div className="my-6 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{percentage.toFixed(0)}٪</div>
              <div className={`text-lg font-bold mt-1 ${grade.color}`}>{grade.label}</div>
            </div>
          </div>

          {/* التقييم بالنجوم */}
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                className={`w-5 h-5 ${i <= Math.round(percentage / 20) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
              />
            ))}
          </div>

          {/* التاريخ */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {subjectName}
            </span>
          </div>

          {/* زر الطباعة */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 mx-auto bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة الشهادة
          </button>
        </div>
      </div>
    </div>
  )
}
