'use client'

import { useState } from 'react'
import { Award, Download, Eye, Printer, Share2, CheckCircle, Star } from 'lucide-react'

interface Props {
  attempt: any
  studentName: string
  grade?: string
}

export default function CertificateCard({ attempt, studentName, grade }: Props) {
  const [showPreview, setShowPreview] = useState(false)

  const exam = attempt.exams
  const subject = exam?.subjects
  const percentage = attempt.percentage?.toFixed(0)
  const completedDate = new Date(attempt.completed_at).toLocaleDateString('ar-EG', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const isExcellent = attempt.percentage >= 90
  const isVeryGood = attempt.percentage >= 80 && attempt.percentage < 90
  const isGood = attempt.percentage >= 70 && attempt.percentage < 80

  const getGrade = () => {
    if (attempt.percentage >= 90) return { text: 'امتياز', color: '#C5A028', bg: '#FEF9EE' }
    if (attempt.percentage >= 80) return { text: 'جيد جداً', color: '#1B4F72', bg: '#EBF5FB' }
    if (attempt.percentage >= 70) return { text: 'جيد', color: '#1E8449', bg: '#EAFAF1' }
    return { text: 'مقبول', color: '#7F8C8D', bg: '#F2F3F4' }
  }

  const grade_info = getGrade()

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const certHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>شهادة - ${exam?.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Cairo', sans-serif; 
            background: white;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh; padding: 20px;
          }
          .certificate {
            width: 800px; padding: 60px;
            border: 12px solid #1B4F72;
            outline: 4px solid #C5A028;
            outline-offset: -20px;
            position: relative;
            background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
            text-align: center;
          }
          .corner {
            position: absolute; width: 60px; height: 60px;
            border-color: #C5A028; border-style: solid;
          }
          .corner-tl { top: 10px; right: 10px; border-width: 3px 0 0 3px; }
          .corner-tr { top: 10px; left: 10px; border-width: 3px 3px 0 0; }
          .corner-bl { bottom: 10px; right: 10px; border-width: 0 0 3px 3px; }
          .corner-br { bottom: 10px; left: 10px; border-width: 0 3px 3px 0; }
          .logo { font-size: 48px; margin-bottom: 8px; }
          .brand { font-size: 22px; font-weight: 900; color: #1B4F72; margin-bottom: 4px; font-family: 'Tajawal'; }
          .divider { width: 200px; height: 3px; background: linear-gradient(90deg, transparent, #C5A028, transparent); margin: 20px auto; }
          .cert-title { font-size: 36px; font-weight: 900; color: #1B4F72; margin-bottom: 4px; font-family: 'Tajawal'; }
          .cert-subtitle { font-size: 16px; color: #7F8C8D; margin-bottom: 30px; }
          .student-name { font-size: 32px; font-weight: 700; color: #C5A028; margin: 16px 0 4px; font-family: 'Tajawal'; border-bottom: 2px dashed #C5A028; display: inline-block; padding: 0 40px 8px; }
          .exam-name { font-size: 20px; font-weight: 600; color: #1B4F72; margin: 16px 0 8px; }
          .subject-badge { display: inline-block; background: #EBF5FB; color: #1B4F72; padding: 4px 16px; border-radius: 20px; font-size: 14px; margin-bottom: 20px; }
          .score-circle { width: 100px; height: 100px; border-radius: 50%; background: #1B4F72; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 20px auto; }
          .score-num { font-size: 32px; font-weight: 900; line-height: 1; }
          .score-label { font-size: 10px; opacity: 0.8; }
          .grade-badge { display: inline-block; padding: 8px 30px; border-radius: 30px; font-size: 20px; font-weight: 700; margin: 16px 0; }
          .footer-text { font-size: 13px; color: #95A5A6; margin-top: 30px; }
          .date { font-size: 14px; color: #7F8C8D; margin-top: 8px; }
          @media print {
            body { min-height: auto; }
            .certificate { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
          
          <div class="logo">🏛️</div>
          <div class="brand">منصة إتقان مصر</div>
          <div class="divider"></div>
          
          <div class="cert-title">شهادة إنجاز</div>
          <div class="cert-subtitle">Certificate of Achievement</div>
          
          <p style="font-size:15px;color:#555;margin-bottom:4px">يشهد بأن الطالب/ة</p>
          <div class="student-name">${studentName}</div>
          ${grade ? `<p style="font-size:14px;color:#777;margin:6px 0">${grade}</p>` : ''}
          
          <p style="font-size:15px;color:#555;margin:20px 0 4px">قد اجتاز بنجاح اختبار</p>
          <div class="exam-name">${exam?.title}</div>
          <div class="subject-badge">${subject?.icon || '📚'} ${subject?.name_ar || ''}</div>
          
          <div style="display:flex;align-items:center;justify-content:center;gap:30px;margin:10px 0">
            <div style="text-align:center">
              <div style="font-size:12px;color:#999">الدرجة المحققة</div>
              <div style="font-size:22px;font-weight:700;color:#1B4F72">${attempt.score}/${exam?.total_points}</div>
            </div>
            <div class="score-circle">
              <div class="score-num">${percentage}٪</div>
              <div class="score-label">النسبة</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:12px;color:#999">التقدير</div>
              <div style="font-size:22px;font-weight:700;color:${grade_info.color}">${grade_info.text}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer-text">هذه الشهادة صادرة بشكل آلي من منصة إتقان مصر التعليمية</div>
          <div class="date">تاريخ الإصدار: ${completedDate}</div>
          <div style="font-size:11px;color:#bbb;margin-top:8px">رقم المحاولة: ${attempt.id}</div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(certHtml)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }

  return (
    <>
      {/* بطاقة الشهادة */}
      <div className="bg-white rounded-3xl border-2 border-border overflow-hidden card-hover">
        {/* رأس البطاقة بتصميم شهادة مصغّر */}
        <div className="relative overflow-hidden p-6" style={{ background: 'linear-gradient(135deg, #1B4F72 0%, #2E86C1 100%)' }}>
          {/* زخارف خلفية */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-2 right-2 text-6xl">🏛️</div>
            <div className="absolute bottom-2 left-2 text-4xl opacity-50">⭐</div>
          </div>

          <div className="relative text-center text-white">
            {isExcellent && (
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            )}
            <div className="text-3xl mb-2">{subject?.icon || '📚'}</div>
            <h3 className="text-lg font-bold line-clamp-2 mb-1">{exam?.title}</h3>
            <p className="text-blue-200 text-sm">{subject?.name_ar}</p>
          </div>
        </div>

        {/* تفاصيل الشهادة */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold" style={{ color: grade_info.color }}>
                {percentage}٪
              </div>
              <div className="text-xs text-muted-foreground">{attempt.score}/{exam?.total_points} درجة</div>
            </div>
            <div
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: grade_info.bg, color: grade_info.color }}
            >
              {grade_info.text}
            </div>
          </div>

          {/* شريط التقدم */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full"
              style={{ width: `${attempt.percentage}%`, background: grade_info.color }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span>تاريخ الاجتياز: {completedDate}</span>
          </div>

          {/* أزرار */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
            >
              <Eye className="w-4 h-4" />
              معاينة
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
          </div>
        </div>
      </div>

      {/* نافذة المعاينة */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* شهادة المعاينة */}
            <div className="relative p-12 text-center" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)', border: '8px solid #1B4F72', outline: '3px solid #C5A028', outlineOffset: '-14px', margin: '16px' }}>
              {/* زوايا الزخرفة */}
              {[
                'top-2 right-2 border-t-2 border-r-0 border-b-0 border-l-2',
                'top-2 left-2 border-t-2 border-r-2 border-b-0 border-l-0',
                'bottom-2 right-2 border-t-0 border-r-0 border-b-2 border-l-2',
                'bottom-2 left-2 border-t-0 border-r-2 border-b-2 border-l-0',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: 'var(--egypt-gold)' }} />
              ))}

              <div className="text-4xl mb-2">🏛️</div>
              <div className="text-xl font-display font-black text-primary mb-1">منصة إتقان مصر</div>

              <div className="w-32 h-0.5 mx-auto my-4" style={{ background: 'linear-gradient(90deg, transparent, #C5A028, transparent)' }} />

              <div className="text-2xl font-display font-black text-primary mb-1">شهادة إنجاز</div>
              <div className="text-sm text-muted-foreground mb-6">Certificate of Achievement</div>

              <p className="text-sm text-muted-foreground mb-1">يشهد بأن الطالب/ة</p>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--egypt-gold)' }}>{studentName}</div>
              {grade && <p className="text-sm text-muted-foreground mb-4">{grade}</p>}

              <p className="text-sm text-muted-foreground mb-1">قد اجتاز بنجاح اختبار</p>
              <div className="text-lg font-bold text-primary mb-2">{exam?.title}</div>
              <div className="inline-block bg-accent text-primary px-4 py-1 rounded-full text-sm mb-5">
                {subject?.icon} {subject?.name_ar}
              </div>

              <div className="flex items-center justify-center gap-8 my-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">الدرجة</div>
                  <div className="text-2xl font-bold text-primary">{attempt.score}/{exam?.total_points}</div>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary text-white flex flex-col items-center justify-center">
                  <div className="text-xl font-black">{percentage}٪</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">التقدير</div>
                  <div className="text-2xl font-bold" style={{ color: grade_info.color }}>{grade_info.text}</div>
                </div>
              </div>

              <div className="w-32 h-0.5 mx-auto my-4" style={{ background: 'linear-gradient(90deg, transparent, #C5A028, transparent)' }} />

              <p className="text-xs text-muted-foreground">تاريخ الإصدار: {completedDate}</p>
            </div>

            {/* أزرار المعاينة */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Printer className="w-4 h-4" />
                طباعة / تنزيل PDF
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center justify-center gap-2 border border-border px-5 py-3 rounded-xl font-medium hover:bg-muted transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
