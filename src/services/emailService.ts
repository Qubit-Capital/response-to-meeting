import { EmailClient } from '@azure/communication-email';

const connectionString = process.env
  .AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING as string;
const emailClient = new EmailClient(connectionString);

export async function sendVerificationEmail(to: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.5;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
        }
        h1 {
          color: #1f2937;
          font-size: 24px;
          margin-bottom: 16px;
        }
        p {
          margin-bottom: 16px;
        }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 600;
        }
        .button:hover {
          background-color: #2563eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Our App!</h1>
        <p>Thank you for signing up. To complete your registration and verify your email address, please click the button below:</p>
        <a href="${verificationUrl}" class="button">Verify Email</a>
        <p>If you didn't sign up for an account, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  const message = {
    senderAddress: process.env.FROM_EMAIL as string,
    content: {
      subject: 'Verify your email address',
      plainText: `Welcome to our app! Please visit this link to verify your email address: ${verificationUrl}`,
      html: htmlContent,
    },
    recipients: {
      to: [
        {
          address: to,
          displayName: 'New User',
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

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        /* ... (use the same styles as in sendVerificationEmail) ... */
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reset Your Password</h1>
        <p>You have requested to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  const message = {
    senderAddress: process.env.FROM_EMAIL as string,
    content: {
      subject: 'Reset your password',
      plainText: `You have requested to reset your password. Please visit this link to set a new password: ${resetUrl}`,
      html: htmlContent,
    },
    recipients: {
      to: [
        {
          address: to,
          displayName: 'User',
        },
      ],
    },
  };

  try {
    const poller = await emailClient.beginSend(message);
    const response = await poller.pollUntilDone();
    console.log('Password reset email sent successfully', response);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    if (error.response) {
      console.error('Azure API responded with:', error.response);
    }
    throw new Error('Failed to send password reset email');
  }
}
