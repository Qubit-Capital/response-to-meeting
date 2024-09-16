import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { emailCategorizerNode } from "@/agents/actors/emailCategorizer";
import { inputNode } from "@/agents/actors/input";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Define the state for our main agent graph
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  emailContent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  category: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  emailId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  currentStep: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "input",
  }),
});

// Define placeholder functions for other nodes
async function memoryMappingNode(state: typeof AgentState.State) {
  console.log("Memory mapping completed");
  return { currentStep: "end" };
}

const workflow = new StateGraph(AgentState)
  .addNode("input", inputNode)
  .addNode("emailCategorizer", emailCategorizerNode)
  .addNode("memoryMapping", memoryMappingNode)
  .addEdge("input", "emailCategorizer")
  .addEdge("emailCategorizer", "memoryMapping")
  .setEntryPoint("input");

// Compile the graph
const app = workflow.compile();

// Export the app for use in other parts of the application
export { app as mainAgentGraph };

// Modify the runExample function
async function runExample() {
  console.log("Starting email categorization process...");
  try {
    // Replace 'your-email-id-here' with an actual email ID for testing
    const emailId = '66ddc5d8e03874ce239e10e1';
    
    const stream = await app.stream({
      messages: [new HumanMessage("Please categorize the next email.")],
      emailId: emailId
    });

    for await (const output of stream) {
      console.log("Current node:", Object.keys(output)[0]);
      const value = Object.values(output)[0];
      if (value.currentStep === "error") {
        console.error("Error:", value.error);
      }
    }
  } catch (error) {
    console.error("Error in runExample:", error);
  }
  console.log("\nEmail categorization process completed.");
}

// Run the example
runExample();