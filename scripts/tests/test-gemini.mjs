import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const conten = fs.readFileSync(envPath, 'utf-8');
  conten.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] ? match[2].trim() : '';
    }
  });
}

loadEnv();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

async function testModel(modelName) {
    try {
        console.log("Testing:", modelName);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello!");
        console.log("Success:", result.response.text());
        return true;
    } catch (e) {
        console.error("Failed:", e.message);
        return false;
    }
}

async function run() {
    const modelsToTest = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-pro-latest', 'gemini-2.5-flash-lite', 'gemma-3-12b-it'];
    for (const m of modelsToTest) {
        const success = await testModel(m);
        if (success) {
            console.log("Use this model:", m);
            break;
        }
    }
}

run();
