import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './knowledge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

// In-memory rate limiting (use Redis in production)
let geminiCallsToday: Date[] = [];

const checkRateLimit = (): boolean => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Remove old calls
  geminiCallsToday = geminiCallsToday.filter(call => call > todayStart);
  
  const limit = parseInt(process.env.GEMINI_DAILY_LIMIT || '50');
  
  if (geminiCallsToday.length >= limit) {
    console.warn(`⚠️ Gemini rate limit reached: ${limit}/day`);
    return false;
  }
  
  geminiCallsToday.push(now);
  console.log(`✅ Gemini call ${geminiCallsToday.length}/${limit}`);
  return true;
};

export const askGemini = async (userMessage: string): Promise<string> => {
  if (!checkRateLimit()) {
    throw new Error('RATE_LIMIT_EXCEEDED');
  }

  try {
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am the Rex Security Patrol Inc virtual assistant. How can I help you today?' }],
        },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();
    
    return response;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};