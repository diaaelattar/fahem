import fs from 'fs';

async function listModels() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const apiKeyMatch = envContent.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

  if (!apiKey) {
    console.error('❌ GOOGLE_GENERATIVE_AI_API_KEY NOT FOUND');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log('Listing models for key:', apiKey.substring(0, 5) + '...');

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Success! Available models:');
      console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
    } else {
      console.error('❌ Failed to list models.');
      console.error('Status:', response.status);
      console.error('Error Details:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Network Error:', error.message);
  }
}

listModels();
