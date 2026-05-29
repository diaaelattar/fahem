'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, ClipboardList, CheckCircle, Share2 } from 'lucide-react'
import { useState } from 'react'
import { ExamShareModal } from './ExamShareModal'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
}

// زر المشاركة المنفصل لكل اختبار
function ShareButton({ examId, examTitle }: { examId: string; examTitle: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-600"
        title="مشاركة الاختبار"
      >
        <Share2 className="h-3.5 w-3.5" />
        مشاركة
      </button>
      {open && (
        <ExamShareModal
          examId={examId}
          examTitle={examTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

export function AnimatedExamGrid({ exams }: { exams: any[] }) {
  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {exams.map((exam) => (
        <motion.div
          key={exam.id}
          variants={item}
          whileHover={{ y: -4 }}
          className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg"
        >
          <div className="flex items-start justify-between border-b border-slate-100 p-5">
            <div>
              <h3 className="mb-1 font-bold text-slate-800">{exam.title}</h3>
              <div className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                مجموعة: {exam.student_groups?.name_ar || 'عام'}
              </div>
            </div>
            <div
              className={`rounded-full p-1.5 ${exam.is_published ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
            >
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex gap-4 p-5 text-sm font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              {exam.duration_minutes} دقيقة
            </div>
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-slate-400" />
              {exam.questions_count || 0} أسئلة
            </div>
          </div>
          <div className="mt-auto grid grid-cols-4 gap-2 border-t border-slate-100 bg-slate-50 p-4">
            <Link
              href={`/teacher/exams/${exam.id}/edit`}
              className="rounded-lg py-2 text-center text-xs font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
              تعديل
            </Link>
            <Link
              href={`/teacher/reports?exam_id=${exam.id}`}
              className="rounded-lg py-2 text-center text-xs font-bold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
            >
              النتائج
            </Link>
            <Link
              href={`/teacher/exams/${exam.id}/print`}
              className="rounded-lg py-2 text-center text-xs font-bold text-slate-600 transition-colors hover:bg-purple-50 hover:text-purple-600"
            >
              🖨️ طباعة
            </Link>
            <ShareButton examId={exam.id} examTitle={exam.title} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
