import React from 'react';
import { useAuth } from '@/context/AuthContext';

const Inbox: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Inbox</h1>
      <p className="text-xl">Welcome to your inbox, {user?.name || user?.email || 'User'}!</p>
      <p className="mt-4">This is where you can see your messages and meeting responses.</p>
    </div>
  );
};

export default Inbox;
