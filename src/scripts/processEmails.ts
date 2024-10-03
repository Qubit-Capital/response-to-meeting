import { mainAgentGraph } from '@/agents/mainAgentGraph';
import { HumanMessage } from "@langchain/core/messages";
import axios from 'axios';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import dotenv from 'dotenv';
import { AgentState } from '@/agents/mainAgentGraph';

dotenv.config({ path: '.env.local' });

interface Email {
  _id: string;
  from_email: string;
  subject: string;
  sent_message_text: string;
  reply_message_text: string;
}

async function fetchEmails(): Promise<Email[]> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await axios.get(`${baseUrl}/api/email`);
  return response.data.emails;
}

async function processEmail(email: Email) {
  const stream = await mainAgentGraph.stream({
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
      continue;
    }
    const nodeOutput = Object.values(output)[0];
    finalState = { ...finalState, ...nodeOutput };

    if (nodeOutput.currentStep === "error" || nodeOutput.currentStep === "end") {
      break;
    }
  }

  return finalState;
}

async function processEmailsAndSaveToCsv(numberOfEmailsToProcess: number) {
  const emails = await fetchEmails();
  const csvFilePath = 'email_processing_results.csv';
  
  const fileExists = fs.existsSync(csvFilePath);

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
    append: fileExists
  });

  for (const [index, email] of emails.slice(0, numberOfEmailsToProcess).entries()) {
    console.log(`Processing email ${index + 1}/${numberOfEmailsToProcess}: ${email._id}`);
    const result = await processEmail(email);
    
    const csvRecord = {
      _id: email._id,
      from: email.from_email,
      subject: email.subject,
      sentMessage: email.sent_message_text,
      replyMessage: email.reply_message_text,
      ...result,
      numberOfResponsesIdentifierMemory: JSON.stringify(result.numberOfResponsesIdentifierMemory || []),
      firstResponseGeneratorMemory: JSON.stringify(result.firstResponseGeneratorMemory || []),
    };

    await csvWriter.writeRecords([csvRecord]);
    
    if (index === 0 && !fileExists) {
      console.log("CSV headers written");
    }
    
    console.log(`Email ${email._id} processed and written to CSV`);
  }

  console.log(`Processed ${numberOfEmailsToProcess} emails and saved results to CSV`);
}

const numberOfEmailsToProcess = 100; // You can change this number as needed
processEmailsAndSaveToCsv(numberOfEmailsToProcess).catch(console.error);