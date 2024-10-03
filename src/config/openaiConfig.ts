import dotenv from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Create and export a ChatOpenAI instance
export const openai = new ChatOpenAI({
  modelName: "gpt-4o-mini", // or whatever model you're using
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Function to create a ChatOpenAI instance with tools and strict mode
export function createStrictChatOpenAI(tools: any[]) {
  return openai.bind({
    tools: tools,
    tool_choice: { type: "function", function: { name: tools[0].name } },
  });
}