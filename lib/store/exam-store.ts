import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ExamState {
  examId: string | null
  attemptId: string | null
  answers: Record<string, any> // questionId -> studentAnswer
  timeRemainingSeconds: number | null
  isSubmitting: boolean
  
  startExam: (examId: string, attemptId: string, durationSeconds: number) => void
  setAnswer: (questionId: string, answer: any) => void
  tickTime: () => void
  submitExam: () => void
  clearSession: () => void
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      examId: null,
      attemptId: null,
      answers: {},
      timeRemainingSeconds: null,
      isSubmitting: false,

      startExam: (examId, attemptId, durationSeconds) => set({
        examId,
        attemptId,
        answers: {},
        timeRemainingSeconds: durationSeconds,
        isSubmitting: false
      }),

      setAnswer: (questionId, answer) => set((state) => ({
        answers: {
          ...state.answers,
          [questionId]: answer
        }
      })),

      tickTime: () => set((state) => ({
        timeRemainingSeconds: state.timeRemainingSeconds !== null && state.timeRemainingSeconds > 0
          ? state.timeRemainingSeconds - 1
          : 0
      })),

      submitExam: () => set({ isSubmitting: true }),

      clearSession: () => set({
        examId: null,
        attemptId: null,
        answers: {},
        timeRemainingSeconds: null,
        isSubmitting: false
      })
    }),
    {
      name: 'fahem-exam-storage', // unique name for localStorage
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage so it survives reloads but clears on new tab
    }
  )
)
