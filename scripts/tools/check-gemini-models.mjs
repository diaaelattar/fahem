import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const conten = fs.readFileSync(envPath, 'utf-8')
  conten.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      process.env[match[1]] = match[2] ? match[2].trim() : ''
    }
  })
}

loadEnv()

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
)

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`
    )
    const data = await response.json()
    console.log('Available Models:')
    data.models.forEach((m) => console.log(m.name))
  } catch (e) {
    console.error(e)
  }
}

listModels()
