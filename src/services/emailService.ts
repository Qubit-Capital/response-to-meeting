import { EmailClient } from "@azure/communication-email";

const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING as string;
const emailClient = new EmailClient(connectionString);

export async function sendVerificationEmail(to: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

  const message = {
    senderAddress: process.env.FROM_EMAIL as string,
    content: {
      subject: "Verify your email address",
      plainText: `Welcome to our app! Please visit this link to verify your email address: ${verificationUrl}`,
      html: `
        <h1>Welcome to our app!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `
    },
    recipients: {
      to: [
        {
          address: to,
          displayName: "New User",
        },
      ],
    },
  };

  try {
    const poller = await emailClient.beginSend(message);
    const response = await poller.pollUntilDone();
    console.log('Verification email sent successfully', response);
  } catch (error) {
    console.error('Error sending verification email:', error);
    if (error.response) {
      console.error('Azure API responded with:', error.response);
    }
    throw new Error('Failed to send verification email');
  }
}