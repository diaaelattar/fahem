'use client'

import { useState } from 'react'
import {
  BookOpen,
  BookText,
  Brain,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Hash,
  List,
  Sparkles,
} from 'lucide-react'

// ─── أنواع الأقسام وتصميمها ──────────────────────────────────────────────────
const SECTION_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  intro:      { label: 'مقدمة', icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  content:    { label: 'نص الدرس', icon: BookText, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  vocabulary: { label: 'المفردات', icon: Hash, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  rules:      { label: 'القواعد', icon: List, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  examples:   { label: 'أمثلة', icon: FlaskConical, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  summary:    { label: 'الملخص', icon: Sparkles, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
}

interface Section {
  id: string
  section_type: string
  title: string | null
  body: string
  sort_order: number
}

interface Props {
  sections: Section[]
}

export function LessonViewer({ sections }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-muted-foreground">لا يوجد محتوى لهذا الدرس بعد</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const meta = SECTION_META[section.section_type] ?? SECTION_META['content']
        const Icon = meta.icon
        const isCollapsed = collapsed.has(section.id)

        return (
          <div
            key={section.id}
            className={`rounded-2xl border ${meta.border} overflow-hidden transition-all`}
          >
            {/* رأس القسم */}
            <button
              onClick={() => toggleCollapse(section.id)}
              className={`w-full flex items-center justify-between px-5 py-4 ${meta.bg} transition-colors hover:opacity-90`}
            >
              <div className={`flex items-center gap-3 font-bold ${meta.color}`}>
                <Icon className="h-5 w-5 shrink-0" />
                <span>{section.title || meta.label}</span>
              </div>
              {isCollapsed ? (
                <ChevronDown className={`h-4 w-4 ${meta.color}`} />
              ) : (
                <ChevronUp className={`h-4 w-4 ${meta.color}`} />
              )}
            </button>

            {/* محتوى القسم */}
            {!isCollapsed && (
              <div className="bg-white px-6 py-5">
                {section.section_type === 'vocabulary' ? (
                  // عرض المفردات كجدول مبسط
                  <div className="space-y-2">
                    {section.body.split('\n').filter(Boolean).map((line, i) => {
                      const [word, ...rest] = line.split(':')
                      return (
                        <div key={i} className="flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-2.5">
                          <span className="font-bold text-emerald-700 shrink-0">{word?.trim()}</span>
                          {rest.length > 0 && (
                            <>
                              <span className="text-emerald-400">:</span>
                              <span className="text-emerald-800">{rest.join(':').trim()}</span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div
                    dir="rtl"
                    className="prose prose-sm max-w-none leading-loose text-gray-700 whitespace-pre-wrap"
                  >
                    {section.body}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
