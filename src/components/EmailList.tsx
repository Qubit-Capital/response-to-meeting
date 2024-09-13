import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Email } from '@/models/Email';

interface EmailListProps {
  emails: Email[];
  onSelectEmail: (email: Email) => void;
}

const EmailList: React.FC<EmailListProps> = ({ emails, onSelectEmail }) => {
  return (
    <div className="overflow-auto">
      {emails.map((email) => (
        <div 
          key={email._id.$oid} 
          className="p-2 border-b hover:bg-gray-100 cursor-pointer flex items-center"
          onClick={() => onSelectEmail(email)}
        >
          <Avatar className="mr-2">
            <AvatarFallback>{email.from_email[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow truncate">
            <span className="font-semibold mr-2">{email.from_email}</span>
            <span className="text-gray-600">{email.subject}</span>
            <span className="text-gray-400 ml-2 truncate">{email.sent_message_text.slice(0, 50)}...</span>
          </div>
          <div className="flex items-center">
            <Badge variant="secondary" className="mr-1">{email.status}</Badge>
            <span className="text-sm text-gray-500 ml-2">{new Date(email.event_timestamp).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmailList;