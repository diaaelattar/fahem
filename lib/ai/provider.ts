// lib/ai/provider.ts

import { getOpenAIClient } from './openai-client'
import { getGeminiModel, parseGeminiJSON } from './gemini-client'
import { AI_CONFIG } from './config'

export interface AICompletionOptions {
  systemPrompt?: string
  responseFormat?: 'json' | 'text'
  provider?: 'openai' | 'google'
}

/**
 * دالة موحدة لتوليد النصوص من مزودين مختلفين (OpenAI أو Google Gemini)
 */
export async function generateAICompletion(
  prompt: string,
  options: AICompletionOptions = {},
  task: keyof typeof AI_CONFIG = 'questionGeneration'
): Promise<string> {
  const provider = options.provider || AI_CONFIG[task] || AI_CONFIG.fallback

  if (provider === 'openai') {
    const openai = getOpenAIClient()
    const messages = []
    if (options.systemPrompt) {
      messages.push({ role: 'system' as const, content: options.systemPrompt })
    }
    messages.push({ role: 'user' as const, content: prompt })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format:
        options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
    })

    return completion.choices[0].message.content || ''
  } else {
    // Google Gemini
    const model = getGeminiModel(
      options.responseFormat === 'json' ? 'gemini-1.5-pro' : 'gemini-1.5-flash'
    )

    let geminiPrompt = prompt
    if (options.systemPrompt) {
      geminiPrompt = `${options.systemPrompt}\n\n${prompt}`
    }

    const result = await model.generateContent(geminiPrompt)
    const responseText = result.response.text()

    if (options.responseFormat === 'json') {
      try {
        const parsed = parseGeminiJSON(responseText)
        return JSON.stringify(parsed)
      } catch {
        return responseText
      }
    }

    return responseText
  }
}
