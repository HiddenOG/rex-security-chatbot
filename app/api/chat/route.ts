import { NextRequest, NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';
import { generateSimulatedResponse, extractIntent } from '../../../lib/knowledge';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let rawResponse = '';
    let source = '';

    // Step 1: Try simulated response first
    const simulatedResponse = generateSimulatedResponse(message);
    
    if (simulatedResponse) {
      console.log('📦 Using simulated response');
      rawResponse = simulatedResponse;
      source = 'simulated';
    } else {
      // Step 2: Use Gemini for complex queries
      try {
        console.log('🤖 Using Gemini for complex query');
        rawResponse = await askGemini(message);
        source = 'gemini';
      } catch (error: any) {
        if (error.message === 'RATE_LIMIT_EXCEEDED') {
          return NextResponse.json({ 
            response: "I'm currently experiencing high demand. Please contact our operations team directly at 832-690-5813 or email rexllc24@gmail.com for immediate assistance.",
            source: 'fallback',
            intent: 'none'
          });
        }
        throw error;
      }
    }

    // Step 3: Extract intent from response
    const { intent, cleanResponse } = extractIntent(rawResponse);

    console.log(`🎯 Detected intent: ${intent}`);

    return NextResponse.json({ 
      response: cleanResponse,
      source,
      intent
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}