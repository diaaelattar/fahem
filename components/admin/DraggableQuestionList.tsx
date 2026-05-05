'use client'

import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'

// Item Component
function SortableItem({ id, question, onRemove }: { id: string, question: any, onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-3 bg-white border border-border p-3 rounded-xl shadow-sm mb-2"
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none p-1 text-muted-foreground hover:text-primary">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 mb-1">
          <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 rounded-md">{question.question_type}</span>
          <span className="text-xs font-bold bg-green-50 text-green-700 px-2 rounded-md">{question.difficulty_level}</span>
        </div>
        <p className="text-sm font-medium truncate" dangerouslySetInnerHTML={{ __html: question.question_text }}></p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4" />
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

export function DraggableQuestionList({ questions, setQuestions, onRemove }: DraggableQuestionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id)
      const newIndex = questions.findIndex(q => q.id === over.id)
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
        items={questions.map(q => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {questions.map(q => (
            <SortableItem key={q.id} id={q.id} question={q} onRemove={onRemove} />
          ))}
          {questions.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
              لم تقم بإضافة أي أسئلة للاختبار بعد. ابحث في البنك وأضف أسئلة.
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
