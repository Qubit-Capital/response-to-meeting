import { AgentState } from "@/agents/mainAgentGraph";
import axios from 'axios';
import { Email } from '@/models/Email';

export async function inputNode(state: typeof AgentState.State) {
    console.log("state in inputNode:", state)
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

    console.log("Fetched email object:", JSON.stringify(email, null, 2));

    return { 
      from: email.from_email,
      subject: email.subject,
      sentMessage: email.sent_message_text,
      replyMessage: email.reply_message_text,
      emailId,
      currentStep: "emailCategorizer",
      nextStep: "memoryMapping"
    };
  } catch (error) {
    console.error('Error fetching email:', error.message);
    return { currentStep: "error", error: error.message || 'Unknown error occurred' };
  }
}