'use client'

import { useState, useMemo, useCallback } from 'react'
import { CheckCircle, ChevronDown, ChevronUp, Info } from 'lucide-react'
import {
  EGYPT_GRADES,
  STAGE_LABELS,
  STAGE_ICONS,
  TRACK_LABELS,
  getSubjectsForGrade,
  type EducationalStage,
  type EduGrade,
} from '@/lib/constants/egyptCurriculum'

export interface TeacherGradeSubjectPair {
  grade_name_ar: string
  subject_name_ar: string
}

interface DBGrade {
  id: number
  name_ar: string
  stage_id: number
  grade_number: number
  track?: string | null
}

interface DBSubject {
  id: number
  name_ar: string
  icon: string
}

interface Props {
  /** Grades loaded from DB (used to cross-reference IDs) */
  dbGrades: DBGrade[]
  /** All subjects loaded from DB */
  dbSubjects: DBSubject[]
  /** Controlled value: list of { grade_id, subject_id } pairs */
  value: Array<{ grade_id: number; subject_id: number }>
  onChange: (pairs: Array<{ grade_id: number; subject_id: number }>) => void
  /** Optional: mark as required */
  required?: boolean
}

// Ordered stages
const STAGES: EducationalStage[] = ['primary', 'preparatory', 'secondary']

export function TeacherGradeSubjectPicker({ dbGrades, dbSubjects, value, onChange, required }: Props) {
  const [openStage, setOpenStage] = useState<EducationalStage | null>('primary')

  // Build lookup maps
  const gradeByName = useMemo(() => {
    const map = new Map<string, DBGrade>()
    dbGrades.forEach((g) => map.set(g.name_ar, g))
    return map
  }, [dbGrades])

  const subjectByName = useMemo(() => {
    const map = new Map<string, DBSubject>()
    dbSubjects.forEach((s) => map.set(s.name_ar, s))
    return map
  }, [dbSubjects])

  // Resolved selected pairs as a Set of "gradeId:subjectId" strings for O(1) lookup
  const selectedSet = useMemo(
    () => new Set(value.map((p) => `${p.grade_id}:${p.subject_id}`)),
    [value]
  )

  const togglePair = useCallback(
    (gradeId: number, subjectId: number) => {
      const key = `${gradeId}:${subjectId}`
      if (selectedSet.has(key)) {
        onChange(value.filter((p) => !(p.grade_id === gradeId && p.subject_id === subjectId)))
      } else {
        onChange([...value, { grade_id: gradeId, subject_id: subjectId }])
      }
    },
    [selectedSet, value, onChange]
  )

  // Select all subjects for a grade
  const toggleAllSubjectsForGrade = useCallback(
    (grade: EduGrade, subjects: string[]) => {
      const dbGrade = gradeByName.get(grade.name_ar)
      if (!dbGrade) return
      const subjectIds = subjects
        .map((s) => subjectByName.get(s)?.id)
        .filter((id): id is number => id !== undefined)

      const allSelected = subjectIds.every((sid) =>
        selectedSet.has(`${dbGrade.id}:${sid}`)
      )

      if (allSelected) {
        // deselect all for this grade
        onChange(value.filter((p) => p.grade_id !== dbGrade.id))
      } else {
        // add missing ones
        const newPairs = subjectIds
          .filter((sid) => !selectedSet.has(`${dbGrade.id}:${sid}`))
          .map((sid) => ({ grade_id: dbGrade.id, subject_id: sid }))
        onChange([...value, ...newPairs])
      }
    },
    [gradeByName, subjectByName, selectedSet, value, onChange]
  )

  // Group EGYPT_GRADES by stage
  const gradesByStage = useMemo(
    () =>
      EGYPT_GRADES.reduce(
        (acc, g) => {
          if (!acc[g.stage]) acc[g.stage] = []
          acc[g.stage].push(g)
          return acc
        },
        {} as Record<EducationalStage, EduGrade[]>
      ),
    []
  )

  // Count selected pairs per stage
  const selectedCountByStage = useMemo(() => {
    const counts: Record<EducationalStage, number> = { primary: 0, preparatory: 0, secondary: 0 }
    value.forEach((pair) => {
      const grade = dbGrades.find((g) => g.id === pair.grade_id)
      if (!grade) return
      const stageId = grade.stage_id
      // map stage_id to EducationalStage based on known grade_numbers
      const stage = stageId === 1 ? 'primary' : stageId === 2 ? 'preparatory' : 'secondary'
      counts[stage]++
    })
    return counts
  }, [value, dbGrades])

  return (
    <div className="space-y-3">
      {required && value.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Info className="h-4 w-4 shrink-0" />
          يرجى اختيار صف دراسي ومادة على الأقل للمتابعة
        </div>
      )}

      {STAGES.map((stage) => {
        const grades = gradesByStage[stage] ?? []
        const count = selectedCountByStage[stage]
        const isOpen = openStage === stage

        return (
          <div
            key={stage}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all"
          >
            {/* Stage header */}
            <button
              type="button"
              onClick={() => setOpenStage(isOpen ? null : stage)}
              className="flex w-full items-center justify-between px-5 py-4 text-right transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{STAGE_ICONS[stage]}</span>
                <div>
                  <div className="font-bold text-slate-800">{STAGE_LABELS[stage]}</div>
                  {count > 0 && (
                    <div className="mt-0.5 text-xs text-indigo-600 font-semibold">
                      {count} مادة / صف محددة
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {count}
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Stage body */}
            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {grades.map((grade) => {
                  const dbGrade = gradeByName.get(grade.name_ar)
                  if (!dbGrade) return null

                  const subjects = getSubjectsForGrade(grade)
                  const availableSubjects = subjects.filter((s) => subjectByName.has(s))

                  const allSelectedForGrade =
                    availableSubjects.length > 0 &&
                    availableSubjects.every((s) => {
                      const dbSubject = subjectByName.get(s)
                      return dbSubject && selectedSet.has(`${dbGrade.id}:${dbSubject.id}`)
                    })

                  const someSelectedForGrade = availableSubjects.some((s) => {
                    const dbSubject = subjectByName.get(s)
                    return dbSubject && selectedSet.has(`${dbGrade.id}:${dbSubject.id}`)
                  })

                  return (
                    <div key={grade.name_ar} className="px-5 py-4">
                      {/* Grade row */}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700">
                            {grade.name_ar}
                          </span>
                          {grade.track && (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                              {TRACK_LABELS[grade.track]}
                            </span>
                          )}
                        </div>
                        {availableSubjects.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleAllSubjectsForGrade(grade, availableSubjects)}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                              allSelectedForGrade
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : someSelectedForGrade
                                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {allSelectedForGrade ? 'إلغاء الكل' : 'تحديد الكل'}
                          </button>
                        )}
                      </div>

                      {/* Subject chips */}
                      {availableSubjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {availableSubjects.map((subjectName) => {
                            const dbSubject = subjectByName.get(subjectName)
                            if (!dbSubject) return null
                            const isSelected = selectedSet.has(`${dbGrade.id}:${dbSubject.id}`)

                            return (
                              <button
                                key={subjectName}
                                type="button"
                                onClick={() => togglePair(dbGrade.id, dbSubject.id)}
                                className={`relative flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                                }`}
                              >
                                <span>{dbSubject.icon}</span>
                                <span>{subjectName}</span>
                                {isSelected && (
                                  <CheckCircle className="h-3.5 w-3.5 text-indigo-600" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          لا توجد مواد متاحة لهذا الصف في قاعدة البيانات
                        </p>
                      )}

                      {/* Secondary: extra subjects from DB not in the preset list */}
                      {grade.stage === 'secondary' && (
                        <div className="mt-3">
                          <p className="mb-2 text-xs font-semibold text-slate-500">
                            مواد إضافية متاحة:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dbSubjects
                              .filter((s) => !availableSubjects.includes(s.name_ar))
                              .map((dbSubject) => {
                                const isSelected = selectedSet.has(`${dbGrade.id}:${dbSubject.id}`)
                                return (
                                  <button
                                    key={dbSubject.id}
                                    type="button"
                                    onClick={() => togglePair(dbGrade.id, dbSubject.id)}
                                    className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all ${
                                      isSelected
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>{dbSubject.icon}</span>
                                    <span>{dbSubject.name_ar}</span>
                                    {isSelected && (
                                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                    )}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Summary badge */}
      {value.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-bold">
            تم تحديد {value.length} مادة / صف
          </span>
        </div>
      )}
    </div>
  )
}
