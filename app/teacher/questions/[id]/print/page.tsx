import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/permissions'
import { redirect } from 'next/navigation'
import { MathRenderer } from '@/components/ui/MathRenderer'

export const dynamic = 'force-dynamic'

interface PrintPageProps {
  params: { id: string }
  searchParams: { ids?: string }
}

export default async function PrintQuestionPage({
  params,
  searchParams,
}: PrintPageProps) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'teacher') redirect('/auth/login')

  const supabase = await createClient()

  // دعم طباعة سؤال واحد أو مجموعة أسئلة
  const ids = searchParams.ids
    ? searchParams.ids.split(',').filter(Boolean)
    : [params.id]

  const { data: questions } = await (supabase
    .from('questions')
    .select(
      `
      id, question_type, question_text, correct_answer, explanation,
      difficulty_level, points, options, question_image_url, image_position,
      subjects(name_ar, icon),
      grades(name_ar),
      units(name_ar),
      lessons(name_ar)
    `
    )
    .in('id', ids) as any)

  if (!questions || questions.length === 0) redirect('/teacher/questions')

  const TYPE_LABELS: Record<string, string> = {
    mcq: 'اختيار من متعدد',
    true_false: 'صح أو خطأ',
    fill_blank: 'أكمل الفراغ',
    essay: 'مقالية',
    correction: 'تصحيح',
  }

  const DIFF_AR: Record<string, string> = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
  }

  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>طباعة الأسئلة — منصة استباق</title>
        <meta charSet="utf-8" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            background: #fff;
            color: #1e293b;
            padding: 32px;
          }
          .print-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 32px;
          }
          .print-header h1 { font-size: 22px; font-weight: 900; color: #1e293b; }
          .print-header p { font-size: 13px; color: #64748b; margin-top: 4px; }
          .print-btn {
            background: #6366f1;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 10px;
            font-family: 'Cairo', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }
          .question-card {
            border: 1.5px solid #e2e8f0;
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 24px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .question-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
          }
          .badge {
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 999px;
            border: 1px solid currentColor;
          }
          .badge-type { background: #eff6ff; color: #2563eb; }
          .badge-diff-easy { background: #f0fdf4; color: #16a34a; }
          .badge-diff-medium { background: #fffbeb; color: #d97706; }
          .badge-diff-hard { background: #fef2f2; color: #dc2626; }
          .badge-points { background: #f8fafc; color: #475569; }
          .question-text {
            font-size: 15px;
            font-weight: 600;
            line-height: 1.8;
            margin-bottom: 16px;
            color: #0f172a;
          }
          .question-image {
            max-height: 220px;
            max-width: 100%;
            object-fit: contain;
            border-radius: 8px;
            margin-bottom: 16px;
            border: 1px solid #e2e8f0;
          }
          .options-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 16px;
          }
          .option-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1.5px solid #e2e8f0;
            font-size: 13px;
          }
          .option-item.correct {
            border-color: #16a34a;
            background: #f0fdf4;
            color: #15803d;
            font-weight: 700;
          }
          .option-letter {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 13px;
            flex-shrink: 0;
          }
          .option-item.correct .option-letter {
            background: #16a34a;
            color: white;
          }
          .answer-section {
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 16px;
            margin-top: 12px;
          }
          .answer-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }
          .answer-value {
            font-size: 14px;
            font-weight: 700;
            color: #16a34a;
          }
          .explanation {
            margin-top: 8px;
            font-size: 12px;
            color: #475569;
            line-height: 1.6;
          }
          .tf-options {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
          }
          .tf-btn {
            flex: 1;
            padding: 10px;
            border-radius: 10px;
            border: 2px solid #e2e8f0;
            font-size: 14px;
            font-weight: 700;
            text-align: center;
          }
          .tf-btn.correct { border-color: #16a34a; background: #f0fdf4; color: #15803d; }
          .breadcrumb {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 10px;
          }
          @media print {
            .print-btn { display: none !important; }
            body { padding: 16px; }
            .question-card { break-inside: avoid; }
          }
        `}</style>
      </head>
      <body>
        <div className="print-header">
          <div>
            <h1>
              📝 {questions.length > 1 ? `${questions.length} أسئلة` : 'سؤال'} —
              منصة استباق
            </h1>
            <p>
              تمت الطباعة بتاريخ:{' '}
              {new Date().toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button className="print-btn" id="do-print-btn">
            🖨️ طباعة
          </button>
        </div>

        {(questions as any[]).map((q: any, index: number) => (
          <div key={q.id} className="question-card">
            {/* Meta badges */}
            <div className="question-meta">
              <span
                className="badge"
                style={{
                  background: '#e0e7ff',
                  color: '#4338ca',
                  borderColor: '#c7d2fe',
                }}
              >
                {index + 1}
              </span>
              <span className="badge badge-type">
                {TYPE_LABELS[q.question_type] || q.question_type}
              </span>
              <span className={`badge badge-diff-${q.difficulty_level}`}>
                {DIFF_AR[q.difficulty_level] || q.difficulty_level}
              </span>
              <span className="badge badge-points">
                {q.points} {q.points === 1 ? 'درجة' : 'درجات'}
              </span>
            </div>

            {/* الصورة — في الأعلى */}
            {q.question_image_url && q.image_position === 'top' && (
              <img
                src={q.question_image_url}
                alt="صورة السؤال"
                className="question-image"
              />
            )}

            {/* نص السؤال */}
            <div className="question-text">
              <MathRenderer text={q.question_text} />
            </div>

            {/* الصورة — في الأسفل (افتراضي) */}
            {q.question_image_url &&
              (!q.image_position || q.image_position === 'bottom') && (
                <img
                  src={q.question_image_url}
                  alt="صورة السؤال"
                  className="question-image"
                />
              )}

            {/* خيارات MCQ */}
            {q.question_type === 'mcq' && q.options && (
              <div className="options-grid">
                {(q.options as string[]).map((opt: string, i: number) => {
                  const isCorrect = opt === q.correct_answer
                  return (
                    <div
                      key={i}
                      className={`option-item${isCorrect ? 'correct' : ''}`}
                    >
                      <div className="option-letter">
                        {['أ', 'ب', 'ج', 'د'][i]}
                      </div>
                      <MathRenderer text={opt} />
                    </div>
                  )
                })}
              </div>
            )}

            {/* أزرار صح/خطأ */}
            {q.question_type === 'true_false' && (
              <div className="tf-options">
                <div
                  className={`tf-btn${q.correct_answer === 'صح' ? 'correct' : ''}`}
                >
                  ✅ صح
                </div>
                <div
                  className={`tf-btn${q.correct_answer === 'خطأ' ? 'correct' : ''}`}
                >
                  ❌ خطأ
                </div>
              </div>
            )}

            {/* الإجابة + الشرح */}
            <div className="answer-section">
              <div className="answer-label">الإجابة الصحيحة</div>
              <div className="answer-value">
                {q.question_type === 'true_false' ? (
                  q.correct_answer === 'صح' ? (
                    '✅ صح'
                  ) : (
                    '❌ خطأ'
                  )
                ) : (
                  <MathRenderer text={q.correct_answer} />
                )}
              </div>
              {q.explanation && (
                <div className="explanation">
                  <strong>الشرح: </strong>
                  <MathRenderer text={q.explanation} />
                </div>
              )}
            </div>

            {/* التسلسل التعليمي */}
            <div className="breadcrumb">
              {q.grades?.name_ar && <span>{q.grades.name_ar}</span>}
              {q.subjects?.name_ar && (
                <span>
                  {' '}
                  • {q.subjects.icon} {q.subjects.name_ar}
                </span>
              )}
              {q.units?.name_ar && <span> • {q.units.name_ar}</span>}
              {q.lessons?.name_ar && <span> • {q.lessons.name_ar}</span>}
            </div>
          </div>
        ))}

        <script
          dangerouslySetInnerHTML={{
            __html: `
          // auto-trigger print when loaded
          window.addEventListener('load', () => {
            // نعطي وقتاً للخطوط تحميل
            setTimeout(() => {}, 500)
          });
          document.getElementById('do-print-btn')?.addEventListener('click', () => {
            window.print();
          });
        `,
          }}
        />
      </body>
    </html>
  )
}
