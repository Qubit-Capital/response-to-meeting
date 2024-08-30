import React from 'react';
import { useAuth } from '@/context/AuthContext';
import LogoutButton from '@/components/LogoutButton';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name || user?.email}</p>
      <LogoutButton />
    </div>
  );
};

export default Dashboard;
