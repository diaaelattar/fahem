import fs from 'fs';

async function testOpenAIKey() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const apiKeyMatch = envContent.match(/OPENAI_API_KEY=(.*)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY NOT FOUND');
    return;
  }

  console.log('Testing OpenAI key:', apiKey.substring(0, 10) + '...');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ OpenAI Success! Response:', data.choices[0].message.content);
    } else {
      console.error('❌ OpenAI Failed!');
      console.error('Status:', response.status);
      console.error('Error Details:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Network Error:', error.message);
  }
}

testOpenAIKey();
