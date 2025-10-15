import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY.' 
        },
        { status: 500 }
      );
    }

    const { messages } = await req.json();

    const result = streamText({
      model: openai('gpt-4o'),
      system: 'You are a helpful assistant that can analyze images and answer questions about them.',
      messages,
    });
    
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error('API Route Error:', error);
  }
}