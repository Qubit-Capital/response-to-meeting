# Comprehensive Agent Design Documentation

This document provides a detailed overview of the agent-based email response application, integrating the function definitions, inputs and outputs, and LLM prompt templates for each step in the agent graph. Additionally, it includes an updated iterative development plan based on these components.

## Table of Contents
1. [Agent Graph Overview](#agent-graph-overview)
2. [Step-by-Step Agent Workflow with Prompts](#step-by-step-agent-workflow-with-prompts)
3. [Data Structures and Schemas](#data-structures-and-schemas)
4. [Updated Iterative Development Plan](#updated-iterative-development-plan)
5. [Conclusion](#conclusion)

## 1. Agent Graph Overview

The agent processes email exchanges through a series of steps, utilizing Large Language Models (LLMs) at various points. Below is a high-level overview of the agent's workflow:

- Input Node (A): Process the incoming email exchange.
- Email Categorizer (C): Assign a category to the email using an LLM.
- Memory Mapping Agent (MM1, MM2, MM3): Fetch and validate instructions (memories) for actors.
- Number of Responses Identifier (E): Determine the number of responses needed.
- First Response Generator (F1): Generate the first response using the validated instructions.
- First Response Validator (F2): Validate the generated first response.
- Follow-up Responses Generator (F3): Generate follow-up responses if needed.
- Follow-up Responses Validator (F4): Validate the follow-up responses.
- Send to User (G): Send the approved responses to the user.

## 2. Step-by-Step Agent Workflow with Prompts

This section provides a detailed walkthrough of each step in the agent graph, including function definitions, inputs and outputs, and the associated LLM prompt templates.

### 2.1. Input Node (A)

**Function:** Process Email Exchange

**Description:** Receives the email exchange and preprocesses the content for further processing.

**Input:**
```typescript
interface IEmailExchange {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: Date;
  attachments?: any[];
}
```

**Output:**
```typescript
interface IProcessedEmailContent {
  id: string;
  textContent: string;
  // Additional processed data (e.g., extracted entities, sentiment analysis)
}
```

**LLM Usage:** No

### 2.2. Email Categorizer (C)

**Function:** Assign Category to Email

**Description:** Uses an LLM to assign a category to the email based on its content.

**Input:**
```typescript
interface IEmailCategorizerInput {
  emailContent: IProcessedEmailContent;
  categoryList: string[];
}
```

**Output:**
```typescript
interface IEmailCategorizerOutput {
  category: string;
  confidenceScore?: number;
}
```

**LLM Usage:** Yes

**Prompt Template:**
```markdown
You are an AI assistant tasked with categorizing emails. Based on the following email content, assign the most appropriate category from the predefined list.

**Email Content:**
{email_content}

**Predefined Categories:**
{category_list}

**Instructions:**
- Analyze the email content thoroughly.
- Choose the category that best fits the email.
- If multiple categories seem relevant, select the most specific one.
- Provide only the category name as the output.

**Output Format:**
Category: <selected_category>
```

**Variables:**
- `{email_content}`: IProcessedEmailContent.textContent
- `{category_list}`: List of possible email categories

### 2.3. Memory Mapping Agent (MM1, MM2, MM3)

**Function:** Map Learning Memories for Actors

**Description:** Fetches and validates instructions (memories) relevant to a specific actor based on the email content and category.

**Components:**
- Memory Collector
- Memory Validator

**LLM Usage:** Yes

#### 2.3.1. Memory Collector

**Input:**
```typescript
interface IMemoryMappingAgentInput {
  emailContent: IProcessedEmailContent;
  emailCategory: string;
  actor: string;
  learningActingMemories: ILearningActingMemory[];
}
```

**Output:**
```typescript
interface IMemoryCollectorOutput {
  selectedMemories: ILearningActingMemory[];
}
```

**Prompt Template:**
```markdown
You are an AI assistant helping to retrieve relevant instructions for a specific actor in an email processing application.

**Actor:** {actor_name}
**Email Category:** {email_category}
**Email Content:**
{email_content}

**Available Memories:**
{learning_memories}

**Instructions:**
- From the available memories, select those where:
  - The **actor** matches **{actor_name}**.
  - The **category_list** includes **{email_category}** or "*".
- Rank the selected memories based on their relevance to the email content.
- Provide a list of the most relevant memories.

**Output Format:**
A JSON array of selected memories, ordered by relevance.
```

**Variables:**
- `{actor_name}`: IMemoryMappingAgentInput.actor
- `{email_category}`: IMemoryMappingAgentInput.emailCategory
- `{email_content}`: IProcessedEmailContent.textContent
- `{learning_memories}`: IMemoryMappingAgentInput.learningActingMemories

#### 2.3.2. Memory Validator

**Input:**
```typescript
interface IMemoryValidatorInput {
  emailContent: IProcessedEmailContent;
  selectedMemories: ILearningActingMemory[];
}
```

**Output:**
```typescript
interface IMemoryValidatorOutput {
  validatedInstructions: ILearningActingMemory[];
}
```

**Prompt Template:**
```markdown
You are an AI assistant tasked with validating a set of instructions (memories) for processing an email.

**Email Content:**
{email_content}

**Proposed Memories:**
{selected_memories}

**Instructions:**
- For each memory, assess whether it is relevant and appropriate for handling the email.
- Consider the actor's role and the email category.
- Identify any issues with the memories.
- If all memories are valid, confirm their suitability.
- If there are issues, provide feedback and suggest improvements.

**Output Format:**
- If valid:
  Validated Memories: <JSON array of validated memories>
- If not valid:
  Issues Found: <List of issues>
  Suggestions: <List of suggestions>
```

**Variables:**
- `{email_content}`: IProcessedEmailContent.textContent
- `{selected_memories}`: IMemoryValidatorInput.selectedMemories

### 2.4. Number of Responses Identifier (E)

**Function:** Determine Number of Responses Needed

**Description:** Decides how many responses (0-4) need to be generated based on validated instructions and email content.

**Input:**
```typescript
interface INumberOfResponsesIdentifierInput {
  validatedInstructions: ILearningActingMemory[];
  emailContent: IProcessedEmailContent;
}
```

**Output:**
```typescript
interface INumberOfResponsesIdentifierOutput {
  numberOfResponses: number; // Integer between 0 and 4
}
```

**LLM Usage:** Yes

**Prompt Template:**
```markdown
You are an AI assistant determining the number of responses required for an email conversation.

**Email Content:**
{email_content}

**Validated Instructions:**
{validated_instructions}

**Instructions:**
- Analyze the email content and the validated instructions.
- Decide on the appropriate number of responses needed (0 to 4).
- Provide only the number as output.

**Output Format:**
Number of Responses: <number>
```

**Variables:**
- `{email_content}`: IProcessedEmailContent.textContent
- `{validated_instructions}`: INumberOfResponsesIdentifierInput.validatedInstructions

### 2.5. First Response Generator (F1)

**Function:** Generate First Response

**Description:** Creates the initial response to the email using validated instructions.

**Input:**
```typescript
interface IFirstResponseGeneratorInput {
  validatedInstructions: ILearningActingMemory[];
  emailCategory: string;
  emailContent: IProcessedEmailContent;
}
```

**Output:**
```typescript
interface IFirstResponseGeneratorOutput {
  firstResponse: string;
}
```

**LLM Usage:** Yes

**Prompt Template:**
```markdown
You are an AI assistant generating a professional email response.

**Email Content:**
{email_content}

**Email Category:** {email_category}

**Validated Instructions:**
{validated_instructions}

**Instructions:**
- Craft a clear and concise response following the validated instructions.
- Maintain a professional and appropriate tone.
- Ensure the response aligns with company policies and guidelines.

**Output Format:**
First Response:
<Your generated email response>
```

**Variables:**
- `{email_content}`: IProcessedEmailContent.textContent
- `{email_category}`: IFirstResponseGeneratorInput.emailCategory
- `{validated_instructions}`: IFirstResponseGeneratorInput.validatedInstructions

### 2.6. First Response Validator (F2)

**Function:** Validate First Response

**Description:** Checks the generated first response for quality and compliance.

**Input:**
```typescript
interface IFirstResponseValidatorInput {
  firstResponse: string;
  emailContent: IProcessedEmailContent;
  validatedInstructions: ILearningActingMemory[];
}
```

**Output:**
```typescript
interface IFirstResponseValidatorOutput {
  isApproved: boolean;
  feedback?: string;
}
```

**LLM Usage:** Yes

**Prompt Template:**
```markdown
You are an AI assistant tasked with reviewing an email response for quality and compliance.

**Email Content:**
{email_content}

**Validated Instructions:**
{validated_instructions}

**Generated Response:**
{first_response}

**Instructions:**
- Evaluate the response for clarity, tone, and professionalism.
- Ensure it follows the validated instructions.
- Check for compliance with company policies.
- If acceptable, confirm approval.
- If not, list issues and suggest improvements.

**Output Format:**
- If approved:
  Approval Status: Approved
- If not approved:
  Approval Status: Not Approved
  Issues Found: <List of issues>
  Suggestions: <List of improvements>
```

**Variables:**
- `{email_content}`: IProcessedEmailContent.textContent
- `{validated_instructions}`: IFirstResponseValidatorInput.validatedInstructions
- `{first_response}`: IFirstResponseValidatorInput.firstResponse

### 2.7. Follow-up Responses Generator (F3)

**Function:** Generate Follow-up Responses

**Description:** Creates additional follow-up responses as needed.

**Input:**
```typescript
interface IFollowUpResponsesGeneratorInput {
  validatedInstructions: ILearningActingMemory[];
  numberOfResponses: number;
  emailCategory: string;
  emailContent: IProcessedEmailContent;
}
```

**Output:**
```typescript
interface IFollowUpResponsesGeneratorOutput {
  followUpResponses: string[];
}
```

**LLM Usage:** Yes

**Prompt Template:**
```markdown
You are an AI assistant creating follow-up email responses.

**Email Content:**
{email_content}

**Email Category:** {email_category}

**Number of Follow-up Responses Needed:** {number_of_responses}

**Validated Instructions:**
{validated_instructions}

**Instructions:**
- Generate {number_of_responses} follow-up emails following the validated instructions.
- Maintain a professional tone.
- Ensure responses align with company policies.

**Output Format:**
Follow-up Responses:
1. <First follow-up email>
2. <Second follow-up email>
...
```

**Variables:**
- `{email_content}`: IProcessedEmailContent.textContent
- `{email_category}`: IFollowUpResponsesGeneratorInput.emailCategory
- `{number_of_responses}`: IFollowUpResponsesGeneratorInput.numberOfResponses
- `{validated_instructions}`: IFollowUpResponsesGeneratorInput.validatedInstructions

### 2.8. Follow-up Responses Validator (F4)

**Function:** Validate Follow-up Responses

**Description:** Ensures the follow-up responses meet quality and compliance standards.

**Input:**
```typescript
interface IFollowUpResponsesValidatorInput {
  followUpResponses: string[];
  emailContent: IProcessedEmailContent;
  validatedInstructions: ILearningActingMemory[];
}
```

**Output:**
```typescript
interface IFollowUpResponsesValidatorOutput {
  isApproved: boolean;
  feedback?: string;
}
```

**LLM Usage:** Yes

**Prompt Template:**
```markdown
You are an AI assistant reviewing follow-up email responses for quality and compliance.

**Email Content:**
{email_content}

**Validated Instructions:**
{validated_instructions}

**Generated Follow-up Responses:**
{follow_up_responses}

**Instructions:**
- Evaluate each response for adherence to the validated instructions.
- Check for professionalism and compliance.
- If acceptable, confirm approval.
- If not, list issues for each response and suggest improvements.

**Output Format:**
- If approved:
  Approval Status: Approved
- If not approved:
  Approval Status: Not Approved
  Issues Found:
    - Response 1: <Issues and suggestions>
    - Response 2: <Issues and suggestions>
    - ...
```

**Variables:**
- `{email_content}`: IProcessedEmailContent.textContent
- `{validated_instructions}`: IFollowUpResponsesValidatorInput.validatedInstructions
- `{follow_up_responses}`: IFollowUpResponsesValidatorInput.followUpResponses

### 2.9. Send to User (G)

**Function:** Send Final Response Sequence to User

**Description:** Delivers the approved responses to the user.

**Input:**
```typescript
interface ISendToUserInput {
  approvedResponses: {
    firstResponse: string;
    followUpResponses: string[];
  };
}
```

**Output:**
```typescript
interface ISendToUserOutput {
  success: boolean;
  message?: string;
}
```

**LLM Usage:** No

## 3. Data Structures and Schemas

### 3.1. Learning & Acting Memory (LAM) Schema

```typescript
// models/LearningActingMemory.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface ILearningActingMemory extends Document {
  actor: string; // Name of the actor (node) in the agent flow
  category_list: string[]; // List of email categories this memory applies to
  scenario: string; // Description of the situation or context
  instruction: string; // Guidance or actionable content
  additional_data?: Record<string, any>; // Optional additional data
  createdAt: Date;
  updatedAt: Date;
}

const LearningActingMemorySchema: Schema = new Schema(
  {
    actor: { type: String, required: true },
    category_list: { type: [String], required: true },
    scenario: { type: String, required: true },
    instruction: { type: String, required: true },
    additional_data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model<ILearningActingMemory>(
  'LearningActingMemory',
  LearningActingMemorySchema
);
```

### 3.2. Working Memory (WM) Schema

```typescript
// models/WorkingMemory.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IAgentState {
  currentNode: string; // Name of the current node in the agent flow
  inputs: Record<string, any>; // Inputs received at this node
  outputs: Record<string, any>; // Outputs produced at this node
}

export interface IWorkingMemory extends Document {
  sessionId: string; // Unique identifier for the agent's processing session
  states: IAgentState[]; // Array of agent states at different