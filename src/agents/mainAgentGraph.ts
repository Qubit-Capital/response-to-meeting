import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { emailCategorizerNode } from "@/agents/actors/emailCategorizer";
import { inputNode } from "@/agents/actors/input";
import { memoryMappingAgent } from "@/agents/actors/memoryMappingAgent";
import { numberOfResponsesIdentifier } from "@/agents/actors/numberOfResponsesIdentifier";
import { firstResponseGenerator } from "@/agents/actors/firstResponseGenerator";
import { ILearningActingMemory } from "@/models/LearningActingMemory";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Define the state for our main agent graph
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  from: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  subject: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  sentMessage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  replyMessage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  category: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  categoryId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  isNewCategory: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  emailId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  currentStep: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "input",
  }),
  nextStep: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  selectedMemories: Annotation<ILearningActingMemory[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  numberOfResponses: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  error: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

async function noActionRequired(state: typeof AgentState.State) {
  console.log("No Action Required - Informing User");
  return { 
    noActionRequired: {
      ...state,
      currentStep: "end",
      nextStep: "end",
      message: "No action is required for this email.",
    }
  };
}

/*async function firstResponseGenerator(state: typeof AgentState.State) {
  console.log("First Response Generator - Starting");
  // Implement the first response generation logic here
  return { 
    firstResponseGenerator: {
      ...state,
      currentStep: "firstResponseValidator",
      nextStep: "firstResponseValidator",
    }
  };
}*/

async function firstResponseValidator(state: typeof AgentState.State) {
  console.log("First Response Validator - Starting");
  // Implement the first response validation logic here
  return { 
    firstResponseValidator: {
      ...state,
      currentStep: "checkFollowUpNeeded",
      nextStep: "checkFollowUpNeeded",
    }
  };
}

async function checkFollowUpNeeded(state: typeof AgentState.State) {
  console.log("Checking if Follow-up Responses are Needed");
  const numberOfResponses = state.numberOfResponses || 0;
  if (numberOfResponses > 1) {
    return {
      checkFollowUpNeeded: {
        ...state,
        currentStep: "followUpResponsesGenerator",
        nextStep: "followUpResponsesGenerator",
      }
    };
  } else {
    return {
      checkFollowUpNeeded: {
        ...state,
        currentStep: "sendToUser",
        nextStep: "sendToUser",
      }
    };
  }
}

async function followUpResponsesGenerator(state: typeof AgentState.State) {
  console.log("Follow-up Responses Generator - Starting");
  // Implement the follow-up responses generation logic here
  return { 
    followUpResponsesGenerator: {
      ...state,
      currentStep: "followUpResponsesValidator",
      nextStep: "followUpResponsesValidator",
    }
  };
}

async function followUpResponsesValidator(state: typeof AgentState.State) {
  console.log("Follow-up Responses Validator - Starting");
  // Implement the follow-up responses validation logic here
  return { 
    followUpResponsesValidator: {
      ...state,
      currentStep: "sendToUser",
      nextStep: "sendToUser",
    }
  };
}

async function sendToUser(state: typeof AgentState.State) {
  console.log("Sending Final Response Sequence to User");
  // Implement the logic to send the final response sequence to the user
  return { 
    sendToUser: {
      ...state,
      currentStep: "end",
      nextStep: "end",
      message: "Responses have been sent to the user.",
    }
  };
}

const workflow = new StateGraph(AgentState)
  .addNode("input", inputNode)
  .addNode("emailCategorizer", emailCategorizerNode)
  .addNode("memoryMapping", memoryMappingAgent)
  .addNode("numberOfResponsesIdentifier", numberOfResponsesIdentifier)
  .addNode("firstResponseGenerator", firstResponseGenerator)
  .addNode("firstResponseValidator", firstResponseValidator)
  .addNode("checkFollowUpNeeded", checkFollowUpNeeded)
  .addNode("followUpResponsesGenerator", followUpResponsesGenerator)
  .addNode("followUpResponsesValidator", followUpResponsesValidator)
  .addNode("sendToUser", sendToUser)
  .addEdge("input", "emailCategorizer")
  .addEdge("emailCategorizer", "memoryMapping")
  .addConditionalEdges(
    "memoryMapping",
    (state) => {
      if (state.currentStep === "numberOfResponsesIdentifier") {
        return "numberOfResponsesIdentifier";
      } else if (state.currentStep === "firstResponseGenerator") {
        return "firstResponseGenerator";
      } else {
        return "error";
      }
    }
  )
  .addEdge("numberOfResponsesIdentifier", "memoryMapping")
  .addEdge("firstResponseGenerator", "firstResponseValidator")
  .addEdge("firstResponseValidator", "checkFollowUpNeeded")
  .addConditionalEdges(
    "checkFollowUpNeeded",
    (state) => {
      if ((state.numberOfResponses || 0) > 1) {
        return "followUpResponsesGenerator";
      } else {
        return "sendToUser";
      }
    }
  )
  .addEdge("followUpResponsesGenerator", "followUpResponsesValidator")
  .addEdge("followUpResponsesValidator", "sendToUser")
  .setEntryPoint("input");

// Compile the graph
const app = workflow.compile();

// Export the app for use in other parts of the application
export { app as mainAgentGraph };


// Modify the runExample function
async function runExample() {
  console.log("Starting email processing...");
  try {
    const emailId = '66ddc5d8e03874ce239e10da';
    
    const stream = await app.stream({
      messages: [new HumanMessage("Please process the next email.")],
      emailId: emailId,
      currentStep: "input",
      nextStep: "emailCategorizer"
    });

    for await (const output of stream) {
      if (Object.keys(output).length === 0) {
        console.log("Empty output received, continuing to next node");
        continue
      }
      const nodeName = Object.keys(output)[0];
      const nodeOutput = Object.values(output)[0];
      console.log(`Node: ${nodeName}, Current Step: ${nodeOutput.currentStep}, Next Step: ${nodeOutput.nextStep}`);

      if (nodeOutput.currentStep === "error") {
        console.error("Error:", nodeOutput.error);
        break;
      }

      if (nodeOutput.currentStep === "end") {
        console.log("Email processing completed successfully.");
        break;
      }
    }
  } catch (error) {
    console.error("Error in runExample:", error);
  }
  console.log("Email processing finished.");
}

// Run the example
runExample();