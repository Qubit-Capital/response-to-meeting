import React from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const LogoutButton: React.FC = () => {
  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Log out
    </Button>
  );
};

export default LogoutButton;