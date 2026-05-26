import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
)

async function listModels() {
  try {
    console.log('Listing available models...')
    // The newer SDK versions have a listModels method on the genAI instance
    // but sometimes it's through the client. Let's try a manual fetch if needed.
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )
    const data = await response.json()

    if (data.models) {
      console.log('Available models:')
      data.models.forEach((m: any) => {
        console.log(
          `- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`
        )
      })
    } else {
      console.log('Could not list models:', JSON.stringify(data))
    }

    const modelsToTest = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-flash-latest',
      'gemini-pro-latest',
    ]
    for (const m of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: m })
        console.log(`Checking model: ${m}`)
        const result = await model.generateContent('test')
        console.log(`✅ Model ${m} is working.`)
      } catch (e: any) {
        console.log(`❌ Model ${m} failed: ${e.message || e}`)
      }
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

listModels()
