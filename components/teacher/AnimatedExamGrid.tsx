'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, ClipboardList, CheckCircle } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } }
}

export function AnimatedExamGrid({ exams }: { exams: any[] }) {
  return (
    <motion.div 
      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {exams.map((exam) => (
        <motion.div 
          key={exam.id} 
          variants={item}
          whileHover={{ y: -4 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group"
        >
          <div className="p-5 border-b border-slate-100 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-800 mb-1">{exam.title}</h3>
              <div className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                مجموعة: {exam.student_groups?.name_ar || 'عام'}
              </div>
            </div>
            <div className={`p-1.5 rounded-full ${exam.is_published ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="p-5 flex gap-4 text-sm font-bold text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              {exam.duration_minutes} دقيقة
            </div>
            <div className="flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              {exam.questions_count || 0} أسئلة
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto grid grid-cols-3 gap-2">
            <Link href={`/teacher/exams/${exam.id}/edit`} className="text-center text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 py-2 rounded-lg transition-colors">
              تعديل الأسئلة
            </Link>
            <Link href={`/teacher/reports?exam_id=${exam.id}`} className="text-center text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 py-2 rounded-lg transition-colors">
              النتائج والتقارير
            </Link>
            <Link href={`/teacher/exams/${exam.id}/print`} className="text-center text-xs font-bold text-slate-600 hover:text-purple-600 hover:bg-purple-50 py-2 rounded-lg transition-colors">
              🖨️ معاينة وطباعة
            </Link>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
