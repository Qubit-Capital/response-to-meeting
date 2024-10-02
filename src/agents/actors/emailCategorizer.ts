import { openai, createStrictChatOpenAI } from '@/config/openaiConfig';
import { HumanMessage } from "@langchain/core/messages";
import { AgentState } from "@/agents/mainAgentGraph";
import axios from 'axios';
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Email } from '@/models/Email';

// Define the schema for our categorization output
const categorizationSchema = z.object({
  category: z.string().describe("The selected or suggested category name"),
  isNewCategory: z.boolean().describe("Whether this is a new category or an existing one"),
  explanation: z.string().describe("A brief explanation of why this category was chosen")
});

// Define a tool for categorization
const categorizeTool = tool(
  (input: z.infer<typeof categorizationSchema>) => JSON.stringify(input),
  {
    name: "categorize_email",
    description: "Categorize the email based on its content",
    schema: categorizationSchema,
  }
);

async function getCategories() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  console.log(`Fetching categories from: ${baseUrl}/api/categories`);
  const response = await axios.get(`${baseUrl}/api/categories`);
  console.log('Categories fetched:', response.data);
  return response.data;
}

export async function emailCategorizerNode(state: typeof AgentState.State) {
  console.log("state in emailCategorizerNode:", state)
    try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const { sentMessage, replyMessage, emailId } = state;
    
    //console.log('Email content:', emailContent);
    //console.log('Email ID:', emailId);

    if (!emailId) {
      throw new Error('Email ID is undefined');
    }

    // Fetch the email details
    const emailResponse = await axios.get<Email>(`${baseUrl}/api/email/${emailId}`);
    const email = emailResponse.data;

    // Check if the email already has a category assigned
    /*if (email.category && email.category.id && email.category.name) {
      console.log('Email already categorized:', email.category);
      return {
        category: email.category.name,
        categoryId: email.category.id,
        isNewCategory: false,
        currentStep: "memoryMapping",
        nextStep: "numberOfResponsesIdentifier",
        emailId
      };
    }*/

    const categories = await getCategories();
    const categoryList = categories.map((cat: any) => cat.name);
    
    //console.log('Available categories:', categoryList);

    const strictModel = createStrictChatOpenAI([categorizeTool]);

    const prompt = `
You are an AI assistant tasked with categorizing email exchanges between user and prospect. User sent a message and got reply from the prospect. Follow the instructions below to assign the most appropriate category from the predefined list or create a new one.

Instructions:
- If reply message is not in english, always categorize it as 'Non English'. If the category is not defined in the predefined categories list, create it as new one.
- If reply message is HTML CSS code (apart from the signature), always categorize it as 'System Generated'. If the category is not defined in the predefined categories list, create it as new one.
- Consider the reply message when choosing a category. Sent message is just for context.
- Choose the category that best fits the overall email exchange.
- If none of the predefined categories fit well, suggest a new category. Be open to suggest new categories even if there's a somewhat matching category in the list but it could not fully capture the essence.
- If the predefined categories list has less than 9 categories, be more open to create a new category.
- If multiple categories seem relevant, select the most relevant one.

Reply Message:
${replyMessage}

Predefined Categories:
${categoryList.join(", ")}

Sent Message from user (just for additional context):
${sentMessage}
`;

    //console.log('Invoking OpenAI model...');
    const response = await strictModel.invoke([new HumanMessage(prompt)]);
    //console.log('OpenAI response received:', JSON.stringify(response, null, 2));

    if (!response.tool_calls || response.tool_calls.length === 0) {
      throw new Error('No tool calls in the response');
    }

    const toolCall = response.tool_calls[0];
    if (toolCall.name !== 'categorize_email') {
      throw new Error(`Unexpected tool call: ${toolCall.name}`);
    }

    let categorization;
    if (typeof toolCall.args === 'string') {
      categorization = JSON.parse(toolCall.args);
    } else if (typeof toolCall.args === 'object') {
      categorization = toolCall.args;
    } else {
      throw new Error(`Unexpected tool call args type: ${typeof toolCall.args}`);
    }

    console.log('Parsed categorization:', categorization);

    // Check if the category exists in our current list
    const categoryExists = categories.some((cat: any) => cat.name.toLowerCase() === categorization.category.toLowerCase());
    
    let categoryId;
    if (!categoryExists) {
      console.log('Creating new category:', categorization.category);
      const newCategoryResponse = await axios.post(`${baseUrl}/api/categories`, { name: categorization.category });
      categoryId = newCategoryResponse.data.insertedId;
    } else {
      const existingCategory = categories.find((cat: any) => cat.name.toLowerCase() === categorization.category.toLowerCase());
      categoryId = existingCategory._id;
    }

    console.log('Updating email with category:', { categoryId, categoryName: categorization.category });

    await axios.patch(`${baseUrl}/api/email/${emailId}`, {
      category: { id: categoryId, name: categorization.category },
      categorization_explanation: categorization.explanation
    });

    return { 
      category: categorization.category,
      categoryId,
      isNewCategory: !categoryExists,
      currentStep: "memoryMapping",
      nextStep: "numberOfResponsesIdentifier",
      emailId
    };
  } catch (error) {
    console.error('Error in emailCategorizerNode:', error);
    return { 
      currentStep: "error",
      error: error.message || 'Unknown error occurred'
    };
  }
}