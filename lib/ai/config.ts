// lib/ai/config.ts

export const AI_CONFIG = {
  questionGeneration: 'openai', // GPT-4o — جودة عالية
  audioTranscription: 'openai', // Whisper
  fallback: 'google', // Gemini — تكلفة أقل للمهام البسيطة
} as const

export type AIProvider = 'openai' | 'google'
