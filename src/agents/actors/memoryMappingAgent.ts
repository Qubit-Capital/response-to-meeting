import { openai, createStrictChatOpenAI } from '@/config/openaiConfig';
import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "@/agents/mainAgentGraph";
import axios from 'axios';
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ILearningActingMemory } from "@/models/LearningActingMemory";

// Define both schemas at the beginning of the file
const scenarioCollectorSchema = z.object({
  scenarios: z.array(z.string())
});

const scenarioValidatorSchema = z.object({
  scenarios: z.array(z.string())
});

//The tool for scenario collection
const scenarioCollectorTool = tool(
  (input: z.infer<typeof scenarioCollectorSchema>) => JSON.stringify(input),
  {
    name: "collect_scenarios",
    description: "Collect relevant scenarios based on email content",
    schema: scenarioCollectorSchema,
  }
);
  
  function getNextStep(currentStep: string): string {
    switch (currentStep) {
      case "numberOfResponsesIdentifier":
        return "firstResponseGenerator";
      case "firstResponseGenerator":
        return "firstResponseValidator";
      case "firstResponseValidator":
        return "end";
      default:
        return "error";
    }
  }

async function fetchLearningMemories(actor: string, category: string): Promise<ILearningActingMemory[]> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await axios.get(`${baseUrl}/api/lam`, {
    params: { actor, category }
  });
  return response.data;
}

async function memoryValidator(scenarios: string[], sentMessage: string, replyMessage: string,strictModel: any): Promise<string[]> {
  //console.log("memoryValidator input - scenarios:", JSON.stringify(scenarios, null, 2));
  //console.log("memoryValidator input - reply message:",replyMessage, "sent message:", sentMessage);

  const validatorPrompt = `
  You are a critical analyzer tasked with validating the relevance of identified scenarios to an email conversation.

  Reply Message from prospect:
  ${replyMessage}

  Identified Scenarios:
  ${JSON.stringify(scenarios, null, 2)}

  Instructions:
  - Carefully review each scenario and determine if it is truly relevant to respond to prospect's reply.
  - A scenario is only relevant if it is directly and clearly required to respond to prospect's reply.
  - If a scenario is not clearly evident in the email, do not include it.
  - Return only the scenarios that you can confidently say are relevant.
  - If no scenarios are relevant, return an empty array.

  Sent Message from User (just for additional context):
  ${sentMessage}

  Output your response as an array of strings containing only the relevant scenarios.
  `;

  try {
    //console.log("Invoking strictModel for validation");
    const response = await strictModel.invoke([new HumanMessage(validatorPrompt)]);
    //console.log("Validation response:", JSON.stringify(response, null, 2));
    return response.scenarios || []; // Change this line
  } catch (error) {
    //console.error("Memory Validator - Error during validation:", error);
    return [];
  }
}

export async function memoryMappingAgent(state: typeof AgentState.State) {
  //console.log("State in memoryMappingAgent:", JSON.stringify(state, null, 2));
  try {
    const { replyMessage, sentMessage, category, currentStep, emailId, nextStep, categoryId } = state;
    
    // Correctly determine the actor based on the next step
    let actor: string;
    switch (nextStep) {
      case "numberOfResponsesIdentifier":
        actor = "Number of Responses Identifier";
        break;
      case "firstResponseGenerator":
        actor = "First Response Generator";
        break;
      case "firstResponseValidator":
        actor = "First Response Validator";
        break;
      default:
        actor = "Unknown Actor";
    }

    //console.log(`Memory Mapping Agent - Actor: ${actor}, Category: ${category}, Category ID: ${categoryId}`);

    const learningMemories = await fetchLearningMemories(actor, categoryId);
    //console.log("Available memories:", JSON.stringify(learningMemories, null, 2));

    // Extract scenarios from learning memories
    const availableScenarios = learningMemories.map(memory => memory.scenario);
    //console.log("Available scenarios:", JSON.stringify(availableScenarios, null, 2));

    const strictModel = openai.withStructuredOutput(scenarioCollectorSchema);

    const collectorPrompt = `
    You are a memory mapper helping to identify relevant scenarios based on the Reply email in the email conversation between the user and the prospect, if at all any scenarios occur in the email conversation.
    Use the Reply message to identify the scenarios.
    
    Reply message from Prospect: ${replyMessage}

    Available Scenarios:
    ${JSON.stringify(availableScenarios, null, 2)}

    Instructions:
    - Check if any available scenario directly and clearly occurs in the reply message. If yes, then identify the scenario(s) from the available scenarios which very clearly occur in the reply message.
    - It's not required to always identify a scenario. So, in case no scenario directly and clearly occurs in the reply message, then don't select any scenario.
    - If no scenarios directly and clearly occur in the reply message, output an empty array.
    - It is super important to only return the scenarios that directly and clearly occur in the reply message.
    - Double check if the selected scenario(s) occur in the reply message.

    Sent message from user (just for additional context):
    ${sentMessage}
    `;

    let relevantScenarios: string[] = [];
    if (availableScenarios.length > 0) {
      //console.log("Invoking strictModel for scenario collection");
      const response = await strictModel.invoke([new HumanMessage(collectorPrompt)]);
      //console.log("strictModel response:", JSON.stringify(response, null, 2));
      relevantScenarios = response.scenarios;
    }

    //console.log("Relevant scenarios:", JSON.stringify(relevantScenarios, null, 2));

    let validatedScenarios: string[] = [];

    if (relevantScenarios.length > 0) {
      //console.log("Creating validatorModel");
      const validatorModel = openai.withStructuredOutput(scenarioValidatorSchema);

      //console.log("Invoking memoryValidator");
      validatedScenarios = await memoryValidator(relevantScenarios, sentMessage, replyMessage, validatorModel);
      //console.log("Validated scenarios:", JSON.stringify(validatedScenarios, null, 2));
    } else {
      //console.log("No relevant scenarios identified, skipping validation.");
    }

    //console.log("Filtering selected memories");
    const selectedMemories = learningMemories.filter(memory => {
      const isIncluded = validatedScenarios.includes(memory.scenario);
      //console.log(`Memory scenario: ${memory.scenario}, Included: ${isIncluded}`);
      return isIncluded;
    });

    //console.log("Selected memories:", JSON.stringify(selectedMemories, null, 2));

    let actorMemoryKey: string;
    switch (nextStep) {
      case "numberOfResponsesIdentifier":
        actorMemoryKey = "numberOfResponsesIdentifierMemory";
        break;
      case "firstResponseGenerator":
        actorMemoryKey = "firstResponseGeneratorMemory";
        break;
      case "firstResponseValidator":
        actorMemoryKey = "firstResponseValidatorMemory";
        break;
      default:
        actorMemoryKey = "unknownActorMemory";
    }

    return { 
      currentStep: nextStep,
      nextStep: getNextStep(nextStep),
      selectedMemories: selectedMemories,
      [actorMemoryKey]: selectedMemories
    };
  } catch (error) {
    console.error("Memory Mapping Agent - Unexpected error:", error);
    return { 
      currentStep: "error",
      nextStep: "end",
      error: error instanceof Error ? error.message : "Unexpected error in Memory Mapping Agent"
    };
  }
}