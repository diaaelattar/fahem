'use client'

import { useState } from 'react'
import { Eye, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react'
import { TeacherSubmissionReviewModal } from './TeacherSubmissionReviewModal'

interface TeacherAttemptsTableProps {
  initialAttempts: any[]
}

export function TeacherAttemptsTable({ initialAttempts }: TeacherAttemptsTableProps) {
  const [attempts, setAttempts] = useState<any[]>(initialAttempts)
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null)

  const handleScoreUpdated = (attemptId: string, newScore: number, newPercentage: number) => {
    setAttempts((prev) =>
      prev.map((att) => {
        if (att.id === attemptId) {
          const totalPoints = att.exams?.total_points || 1
          const passingScore = att.exams?.passing_score ?? totalPoints * 0.5
          return {
            ...att,
            score: newScore,
            percentage: newPercentage,
            is_passed: newScore >= passingScore,
          }
        }
        return att
      })
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-sm text-slate-500">
            <tr>
              <th className="p-4 font-bold">اسم الطالب</th>
              <th className="p-4 font-bold">تاريخ الاختبار</th>
              <th className="p-4 font-bold">الدرجة النهائية</th>
              <th className="p-4 font-bold">النسبة المئوية</th>
              <th className="p-4 font-bold">المراقبة ورصد الغش</th>
              <th className="p-4 font-bold">الحالة</th>
              <th className="p-4 font-bold text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {attempts.map((attempt: any) => (
              <tr
                key={attempt.id}
                className="transition-colors hover:bg-slate-50/80"
              >
                <td className="p-4 font-bold text-slate-800">
                  {attempt.students?.profiles?.full_name || 'غير معروف'}
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {new Date(attempt.completed_at).toLocaleString('ar-EG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="p-4 text-sm font-black text-slate-700">
                  {attempt.score} / {attempt.exams?.total_points ?? '—'}
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-md px-2.5 py-1 text-sm font-black ${
                      (attempt.percentage || 0) >= 85
                        ? 'bg-emerald-100 text-emerald-700'
                        : (attempt.percentage || 0) >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {Math.round(attempt.percentage || 0)}%
                  </span>
                </td>
                <td className="p-4 text-sm font-medium">
                  {(() => {
                    const violations =
                      attempt.exam_proctoring_events?.length || 0
                    return violations === 0 ? (
                      <span className="font-bold text-emerald-600">
                        ✅ سليم (0)
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-rose-600">
                        ⚠️ مخالفة ({violations})
                      </span>
                    )
                  })()}
                </td>
                <td className="p-4">
                  <span
                    className={`text-xs font-bold ${
                      attempt.is_passed ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {attempt.is_passed ? 'ناجح' : 'راسب'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => setSelectedAttemptId(attempt.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-600 hover:text-white"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    مراجعة وتصحيح
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAttemptId && (
        <TeacherSubmissionReviewModal
          attemptId={selectedAttemptId}
          onClose={() => setSelectedAttemptId(null)}
          onScoreUpdated={handleScoreUpdated}
        />
      )}
    </>
  )
}
