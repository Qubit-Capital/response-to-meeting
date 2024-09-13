import React from 'react';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/LogoutButton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome, {user?.name || user?.email}</p>

      <div className="flex space-x-4 mb-4">
        <Link href="/inbox">
          <Button>Go to Inbox</Button>
        </Link>
        <LogoutButton />
      </div>
      
    </div>
  );
};

export default Dashboard;
