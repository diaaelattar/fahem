import fs from 'fs';

async function testCurrentKey() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const apiKeyMatch = envContent.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

  if (!apiKey) {
    console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY NOT FOUND IN .env.local');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  console.log('Testing key from .env.local:', apiKey.substring(0, 5) + '...');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Success! Key is working.');
    } else {
      console.error('❌ Failed!');
      console.error('Status:', response.status);
      console.error('Error Details:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Network Error:', error.message);
  }
}

testCurrentKey();
