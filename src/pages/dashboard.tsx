import React from 'react';
import { useSession } from 'next-auth/react';
import LogoutButton from '@/components/LogoutButton';

const Dashboard: React.FC = () => {
  const { data: session } = useSession();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session?.user?.name || session?.user?.email}</p>
      <LogoutButton />
    </div>
  );
};

Dashboard.auth = true;

export default Dashboard;