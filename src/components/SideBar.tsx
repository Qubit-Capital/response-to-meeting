import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LogoutButton from '@/components/LogoutButton';
import { useAuth } from '@/context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-gray-100 p-4 h-full">
      <h2 className="text-lg font-semibold mb-4">
        {user?.name || user?.email || 'User'}
      </h2>
      <nav>
        <Button variant="ghost" className="w-full justify-start mb-1">
          <span className="mr-2">📥</span> Inbox <Badge className="ml-auto">128</Badge>
        </Button>
        <Button variant="ghost" className="w-full justify-start mb-1">
          <span className="mr-2">📄</span> Drafts <Badge className="ml-auto">9</Badge>
        </Button>
        <Button variant="ghost" className="w-full justify-start mb-1">
          <span className="mr-2">📤</span> Sent
        </Button>
        <Button variant="ghost" className="w-full justify-start mb-1">
          <span className="mr-2">✅</span> Approved
        </Button>
        <Button variant="ghost" className="w-full justify-start mb-1">
          <span className="mr-2">❌</span> Unapproved
        </Button>
        <Button variant="ghost" className="w-full justify-start mb-1">
          <span className="mr-2">🗃️</span> Archived
        </Button>
      </nav>
      <div className="mt-4">
        <LogoutButton />
      </div>
    </div>
  );
};

export default Sidebar;