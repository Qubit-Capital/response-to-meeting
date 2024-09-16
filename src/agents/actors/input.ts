import { AgentState } from "@/agents/mainAgentGraph";
import axios from 'axios';
import { Email } from '@/models/Email';

export async function inputNode(state: typeof AgentState.State) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const emailId = state.emailId;

    if (!emailId) {
      throw new Error('Email ID is not provided');
    }

    console.log(`Fetching email with ID: ${emailId}`);
    
    // Fetch the specific email
    const response = await axios.get<Email>(`${baseUrl}/api/email/${emailId}`);
    const email = response.data;

    //console.log("Fetched email object:", JSON.stringify(email, null, 2));

    const emailContent = `
From: ${email.from_email}
Subject: ${email.subject}
Sent Message: ${email.sent_message_text}
Reply Message: ${email.reply_message_text}
    `.trim();

    return { 
      emailContent,
      emailId,
      currentStep: "emailCategorizer"
    };
  } catch (error) {
    console.error('Error fetching email:', error.message);
    return { currentStep: "error", error: error.message || 'Unknown error occurred' };
  }
}