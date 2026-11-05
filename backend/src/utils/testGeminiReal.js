const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { GoogleGenAI } = require('@google/genai');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_PROVIDER_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  console.log('Testing real Gemini connection...');
  console.log('Model:', modelName);
  console.log('API Key Present:', !!apiKey);

  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log('Sending request to Gemini...');
    const t0 = Date.now();
    const response = await Promise.race([
      ai.models.generateContent({
        model: modelName,
        contents: 'Respond with valid JSON: {"test": "success", "platform": "CivicAI"}',
        config: {
          responseMimeType: 'application/json'
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 25s')), 25000))
    ]);

    console.log(`Received response in ${Date.now() - t0}ms:`);
    console.log('Raw response text:', response.text);
    const parsed = JSON.parse(response.text);
    console.log('Parsed JSON successfully:', parsed);
    console.log('✓ Gemini API connection test passed!');
  } catch (err) {
    console.error('Gemini API test failed:', err.message || err);
    if (err.status) console.error('Status code:', err.status);
    process.exit(1);
  }
}

testGemini();

