import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { emailCategorizerNode } from "@/agents/actors/emailCategorizer";
import { inputNode } from "@/agents/actors/input";
import { memoryMappingAgent } from "@/agents/actors/memoryMappingAgent";
import { numberOfResponsesIdentifier } from "@/agents/actors/numberOfResponsesIdentifier";
import { firstResponseGenerator } from "@/agents/actors/firstResponseGenerator";
import { ILearningActingMemory } from "@/models/LearningActingMemory";
import dotenv from 'dotenv';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import axios from 'axios';

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
  firstResponse: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  firstFollowUpResponse: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  secondFollowUpResponse: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  thirdFollowUpResponse: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  error: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  numberOfResponsesIdentifierMemory: Annotation<ILearningActingMemory[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  firstResponseGeneratorMemory: Annotation<ILearningActingMemory[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
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
    console.log('Fetching email with ID:', emailId);
    const email = await fetchEmail(emailId);
    
    console.log('Fetched email:', email);

    const stream = await app.stream({
      messages: [new HumanMessage("Please process the next email.")],
      emailId: email._id,
      from: email.from_email,
      subject: email.subject,
      sentMessage: email.sent_message_text,
      replyMessage: email.reply_message_text,
      currentStep: "input",
      nextStep: "emailCategorizer"
    });

    let finalState: typeof AgentState.State = {} as typeof AgentState.State;

    for await (const output of stream) {
      if (Object.keys(output).length === 0) {
        console.log("Empty output received, continuing to next node");
        continue;
      }
      const nodeName = Object.keys(output)[0];
      const nodeOutput = Object.values(output)[0];
      console.log(`Node: ${nodeName}, Current Step: ${nodeOutput.currentStep}, Next Step: ${nodeOutput.nextStep}`);

      finalState = { ...finalState, ...nodeOutput };

      if (nodeOutput.currentStep === "error") {
        console.error("Error:", nodeOutput.error);
        break;
      }

      if (nodeOutput.currentStep === "end") {
        console.log("Email processing completed successfully.");
        break;
      }
    }

    // Write the result to a CSV file
    await writeToCsv(finalState, email);

  } catch (error) {
    console.error("Error in runExample:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
  console.log("Email processing finished.");
}

async function fetchEmail(emailId: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  try {
    const response = await axios.get(`${baseUrl}/api/email/${emailId}`);
    console.log('API Response:', response.data);
    if (response.data && response.data._id) {
      return response.data;  // Return the email object directly
    } else {
      throw new Error('Invalid email data received');
    }
  } catch (error) {
    console.error('Error fetching email:', error);
    throw error;
  }
}

async function writeToCsv(state: typeof AgentState.State, email: any) {
  const csvFilePath = 'single_email_processing_result.csv';
  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    header: [
      { id: '_id', title: 'Email ID' },
      { id: 'from', title: 'From Email' },
      { id: 'subject', title: 'Subject' },
      { id: 'sentMessage', title: 'Sent Message' },
      { id: 'replyMessage', title: 'Reply Message' },
      { id: 'category', title: 'Category' },
      { id: 'categoryId', title: 'Category ID' },
      { id: 'isNewCategory', title: 'Is New Category' },
      { id: 'currentStep', title: 'Current Step' },
      { id: 'nextStep', title: 'Next Step' },
      { id: 'numberOfResponsesIdentifierMemory', title: 'Number of Responses Identifier Memory' },
      { id: 'numberOfResponses', title: 'Number of Responses' },
      { id: 'firstResponseGeneratorMemory', title: 'First Response Generator Memory' },
      { id: 'firstResponse', title: 'First Response' },
      { id: 'firstFollowUpResponse', title: 'First Follow-up Response' },
      { id: 'secondFollowUpResponse', title: 'Second Follow-up Response' },
      { id: 'thirdFollowUpResponse', title: 'Third Follow-up Response' },
      { id: 'error', title: 'Error' },
    ],
  });

  const csvRecord = {
    _id: email._id,
    from: email.from_email,
    subject: email.subject,
    sentMessage: email.sent_message_text,
    replyMessage: email.reply_message_text,
    ...state,
    numberOfResponsesIdentifierMemory: JSON.stringify(state.numberOfResponsesIdentifierMemory || []),
    firstResponseGeneratorMemory: JSON.stringify(state.firstResponseGeneratorMemory || []),
  };

  await csvWriter.writeRecords([csvRecord]);
  console.log(`Results written to ${csvFilePath}`);
}

// Run the example
runExample().catch(console.error);