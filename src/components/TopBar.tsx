import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  onSearch: (query: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSearch }) => {
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('search') as string;
    onSearch(query);
  };

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <h1 className="text-2xl font-bold">Inbox</h1>
      <form onSubmit={handleSearch} className="flex-grow mx-4">
        <Input name="search" placeholder="Search" className="w-full" />
      </form>
      <div className="flex space-x-2">
        <Button variant="ghost">All mail</Button>
        <Button variant="ghost">Unread</Button>
        <Button variant="ghost">🗑️</Button>
        <Button variant="ghost">🕒</Button>
      </div>
    </div>
  );
};

export default TopBar;