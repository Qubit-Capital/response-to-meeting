import React from 'react';
import { Input } from "@/components/ui/input";
import { Email } from '@/models/Email';
import { Button } from "@/components/ui/button";

interface EmailDetailsProps {
  email: Email;
  onGenerateCase: (email: Email) => void;
}

const EmailDetails: React.FC<EmailDetailsProps> = ({ email, onGenerateCase }) => {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">{email.from_email}</h2>
        <p className="text-sm text-gray-500">To: {email.to_name} ({email.to_email})</p>
        <p className="text-sm text-gray-500">Subject: {email.subject}</p>
        <p className="text-sm text-gray-500">Date: {new Date(email.event_timestamp).toLocaleString()}</p>
      </div>
      <div className="mb-4 flex-grow overflow-auto">
        <h3 className="font-semibold mb-2">Sent Message:</h3>
        <p className="whitespace-pre-wrap">{email.sent_message_text}</p>
        {email.reply_message_text && (
          <>
            <h3 className="font-semibold mt-4 mb-2">Reply:</h3>
            <p className="whitespace-pre-wrap">{email.reply_message_text}</p>
          </>
        )}
      </div>
      <div className="flex items-center space-x-2 mb-4">
        <Input placeholder={`Reply to ${email.from_email}...`} className="flex-grow" />
        <Button onClick={() => onGenerateCase(email)}>Generate Case</Button>
      </div>
    </div>
  );
};

export default EmailDetails;