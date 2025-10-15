import { createOpenAI } from "@ai-sdk/openai";
import { OPENAI_API_KEY } from "@/config/openai";

export function getOpenAIClient() {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key not configured. Please add your API key in src/config/openai.ts"
    );
  }

  return createOpenAI({
    apiKey: OPENAI_API_KEY,
  });
}
