import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testApiKey() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  console.log('Testing API Key:', apiKey?.substring(0, 10) + '...');

  if (!apiKey) {
    console.error('Error: GOOGLE_GENERATIVE_AI_API_KEY is not defined in .env.local');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

  try {
    const result = await model.generateContent('Hi');
    console.log('Success! Response:', result.response.text());
  } catch (error) {
    console.error('API Call Failed!');
    console.error('Error Status:', error.status);
    console.error('Error Message:', error.message);
  }
}

testApiKey();
