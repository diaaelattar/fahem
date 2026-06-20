import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ExamState {
  examId: string | null
  attemptId: string | null
  answers: Record<string, string> // questionId -> studentAnswer
  timeRemainingSeconds: number | null
  isSubmitting: boolean

  startExam: (
    examId: string,
    attemptId: string,
    durationSeconds: number,
    initialAnswers?: Record<string, string>
  ) => void
  setAnswer: (questionId: string, answer: string) => void
  tickTime: () => void
  submitExam: () => void
  setSubmitting: (isSubmitting: boolean) => void
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

      startExam: (examId, attemptId, durationSeconds, initialAnswers = {}) =>
        set({
          examId,
          attemptId,
          answers: initialAnswers,
          timeRemainingSeconds: durationSeconds,
          isSubmitting: false,
        }),

      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: answer,
          },
        })),

      tickTime: () =>
        set((state) => ({
          timeRemainingSeconds:
            state.timeRemainingSeconds !== null &&
            state.timeRemainingSeconds > 0
              ? state.timeRemainingSeconds - 1
              : 0,
        })),

      submitExam: () => set({ isSubmitting: true }),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      clearSession: () =>
        set({
          examId: null,
          attemptId: null,
          answers: {},
          timeRemainingSeconds: null,
          isSubmitting: false,
        }),
    }),
    {
      name: 'fahem-exam-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage for offline resilience (BUG-2)
    }
  )
)
