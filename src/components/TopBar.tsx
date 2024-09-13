import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TopBar: React.FC = () => {
  return (
    <div className="flex flex-col border-b">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <div className="flex space-x-2">
          <Button variant="ghost">All mail</Button>
          <Button variant="ghost">Unread</Button>
          <Button variant="ghost">🗑️</Button>
          <Button variant="ghost">🕒</Button>
        </div>
      </div>
      <div className="p-4">
        <Input placeholder="Search" className="w-full" />
      </div>
    </div>
  );
};

export default TopBar;