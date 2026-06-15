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
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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
              <div class="subtitle">منصة استبق - مصر ( فاهم ) التعليمية</div>
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
              <div class="footer">استبق - مصر ( فاهم ) — منصة تعليمية متكاملة</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 500)
  }

  return (
    <div
      id={`cert-${attemptId}`}
      className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-white shadow-lg"
    >
      {/* الخلفية المزخرفة */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #1B4F72 0, #1B4F72 1px, transparent 0, transparent 50%)',
          backgroundSize: '10px 10px',
        }}
      />

      {/* إطار ذهبي داخلي */}
      <div className="m-3 rounded-2xl border-2 border-egypt-gold/50">
        <div className="relative p-8 text-center">
          {/* الأيقونة */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
            <Award className="h-11 w-11 text-white" />
          </div>

          {/* العنوان */}
          <div className="mb-1 text-xs uppercase tracking-[4px] text-muted-foreground">
            شهادة إنجاز
          </div>
          <h2 className="mb-1 text-2xl font-bold text-primary">
            منصة استبق - مصر ( فاهم )
          </h2>

          {/* اسم الطالب */}
          <div className="my-5">
            <p className="mb-2 text-sm text-muted-foreground">
              يُشهد بأن الطالب/الطالبة
            </p>
            <div className="inline-block border-b-2 border-egypt-gold px-8 pb-1">
              <p className="text-2xl font-bold text-foreground">
                {studentName}
              </p>
            </div>
          </div>

          {/* الاختبار */}
          <p className="mb-1 text-sm text-muted-foreground">
            قد اجتاز بنجاح اختبار
          </p>
          <p className="mb-1 text-xl font-bold text-primary">{examTitle}</p>
          <p className="text-sm text-muted-foreground">
            {subjectName} • {gradeName}
          </p>

          {/* الدرجة */}
          <div className="my-6 flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">
                {percentage.toFixed(0)}٪
              </div>
              <div className={`mt-1 text-lg font-bold ${grade.color}`}>
                {grade.label}
              </div>
            </div>
          </div>

          {/* التقييم بالنجوم */}
          <div className="mb-4 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${i <= Math.round(percentage / 20) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
          </div>

          {/* التاريخ */}
          <div className="mb-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {subjectName}
            </span>
          </div>

          {/* زر الطباعة */}
          <button
            onClick={handlePrint}
            className="mx-auto flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Printer className="h-4 w-4" />
            طباعة الشهادة
          </button>
        </div>
      </div>
    </div>
  )
}
