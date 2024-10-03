import { openai } from '@/config/openaiConfig';
import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "@/agents/mainAgentGraph";
import { z } from "zod";

// Define schema for our first response output
const firstResponseSchema = z.object({
  firstResponse: z.string()
});

function getNextStep(currentStep: string): string {
  switch (currentStep) {
    case "firstResponseGenerator":
      return "firstResponseValidator";
    default:
      return "error";
  }
}

export async function firstResponseGenerator(state: typeof AgentState.State) {
  //console.log("state in firstResponseGenerator:", state);
  try {
    const { replyMessage, sentMessage, category, selectedMemories, currentStep } = state;

    //console.log("First Response Generator - Reply Message:", replyMessage);
    //console.log("Email Category:", category);
    
    // Extract only the instructions from selected memories
    const relevantInstructions = selectedMemories.map(memory => memory.instruction);
    //console.log("Relevant Instructions:", JSON.stringify(relevantInstructions, null, 2));

    const strictModel = openai.withStructuredOutput(firstResponseSchema);

    const generatorPrompt = `
    You are an email response generator. Craft a professional email response to the Reply message received from the prospect.
    Email Content contains the Sent message sent from the User and the Reply message received from the prospect. You have to generate a response as a User to respond to the Reply message received from the prospect.
    
    Reply Message from prospect:
    ${replyMessage}

    Sent Message from User (just for additional context):
    ${sentMessage}

    Email Category: ${category}

    Relevant Instructions (HIGHEST PRIORITY):
    ${JSON.stringify(relevantInstructions, null, 2)}

    General Instructions:
    - Craft a clear and concise response as a user who sent the original email.
    - Maintain a professional and clear tone.
    - The response should directly address the content and context of the original email.
    - Don't add any long preambles, greetings or introductions.
    - Include signature of the user who sent the original email.

    Output Format:
    First Response: <Your generated email response>
    `;

    const response = await strictModel.invoke([new HumanMessage(generatorPrompt)]);
    console.log("Generated first response:", response.firstResponse);

    return {
      currentStep: "firstResponseValidator",
      nextStep: "followUpGenerator",
      firstResponse: response.firstResponse
    };
  } catch (error) {
    console.error("First Response Generator - Unexpected error:", error);
    return {
      currentStep: "error",
      nextStep: "end",
      error: error instanceof Error ? error.message : "Unexpected error in First Response Generator"
    };
  }
}