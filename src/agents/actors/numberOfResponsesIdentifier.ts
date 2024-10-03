import { openai } from '@/config/openaiConfig';
import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "@/agents/mainAgentGraph";
import { z } from "zod";

// Define schema for our number of responses output
const numberOfResponsesSchema = z.object({
  numberOfResponses: z.number()
});

export async function numberOfResponsesIdentifier(state: typeof AgentState.State) {
  //console.log("state in numberOfResponsesIdentifier:", state);
  try {
    const { sentMessage, replyMessage, selectedMemories, currentStep } = state;

    //console.log("Number of Responses Identifier - Reply Message:", replyMessage);
    
    // Extract only the instructions from selected memories
    const relevantInstructions = selectedMemories.map(memory => memory.instruction);
    //console.log("Relevant Instructions:", JSON.stringify(relevantInstructions, null, 2));

    const strictModel = openai.withStructuredOutput(numberOfResponsesSchema);

    const identifierPrompt = `
    You are an AI assistant determining the number of responses required for an email conversation.

    Relevant Instructions (HIGHEST PRIORITY):
    ${JSON.stringify(relevantInstructions, null, 2)}

    General Instructions:
    - The default number of responses is 3: a direct response and two follow-ups.
    - Analyze the email content and the relevant instructions carefully.
    - Give the highest priority to the relevant instructions provided above.
    - Adjust the number of responses (1 to 4) if the relevant instructions suggest a different approach.
    - Consider reducing the number of responses for simple queries or when fewer follow-ups are needed.
    - Consider increasing to 4 responses only for complex situations requiring extended follow-up.

    Reply Message (for identification of number of responses):
    ${replyMessage}

    Sent Message (just for additional context):
    ${sentMessage}

    Output Format:
    Number of Responses: <number>
    `;

    const response = await strictModel.invoke([new HumanMessage(identifierPrompt)]);
    console.log("Number of responses identified:", response.numberOfResponses);

    return {
      currentStep: "memoryMapping",
      nextStep: "firstResponseGenerator",
      numberOfResponses: response.numberOfResponses
    };
  } catch (error) {
    console.error("Number of Responses Identifier - Unexpected error:", error);
    return {
      currentStep: "error",
      nextStep: "end",
      error: error instanceof Error ? error.message : "Unexpected error in Number of Responses Identifier"
    };
  }
}