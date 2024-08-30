import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyRequest() {
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { email } = router.query;

  const handleResendVerification = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent successfully. Please check your inbox.');
      } else {
        setMessage(data.message || 'Error resending verification email');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We&apos;ve sent a verification email to {email}. Please check your inbox and click the verification link.
        </p>
        <div className="mt-5">
          <Button onClick={handleResendVerification} className="w-full">
            Resend Verification Email
          </Button>
        </div>
        {message && (
          <p className="mt-2 text-center text-sm text-red-600">{message}</p>
        )}
        <div className="mt-5 text-center">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}