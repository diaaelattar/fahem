'use client'

import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'

// Item Component
function SortableItem({
  id,
  question,
  onRemove,
}: {
  id: string
  question: any
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none p-1 text-muted-foreground hover:text-primary"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex gap-2">
          <span className="rounded-md bg-blue-50 px-2 text-xs font-bold text-blue-700">
            {question.question_type}
          </span>
          <span className="rounded-md bg-green-50 px-2 text-xs font-bold text-green-700">
            {question.difficulty_level}
          </span>
        </div>
        <p
          className="truncate text-sm font-medium"
          dangerouslySetInnerHTML={{ __html: question.question_text }}
        ></p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

// Main List Component
interface DraggableQuestionListProps {
  questions: any[]
  setQuestions: (questions: any[]) => void
  onRemove: (id: string) => void
}

export function DraggableQuestionList({
  questions,
  setQuestions,
  onRemove,
}: DraggableQuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id)
      const newIndex = questions.findIndex((q) => q.id === over.id)
      setQuestions(arrayMove(questions, oldIndex, newIndex))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {questions.map((q) => (
            <SortableItem
              key={q.id}
              id={q.id}
              question={q}
              onRemove={onRemove}
            />
          ))}
          {questions.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              لم تقم بإضافة أي أسئلة للاختبار بعد. ابحث في البنك وأضف أسئلة.
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
