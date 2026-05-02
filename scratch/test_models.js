const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  try {
    const models = await genAI.getModels();
    console.log("Available models:");
    models.forEach(model => {
      console.log(`- ${model.name} : ${model.supportedGenerationMethods.join(', ')}`);
    });
  } catch (e) {
    console.error("Error listing models:", e);
    
    // Fallback if getModels isn't straightforward
    console.log("Attempting direct fetch...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
        const data = await response.json();
        const availableModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
        console.log("Models supporting generateContent:");
        availableModels.forEach(m => console.log(`- ${m.name}`));
    } catch (e2) {
        console.error("Fetch error:", e2);
    }
  }
}

listModels();
