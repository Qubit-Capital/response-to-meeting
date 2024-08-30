import { NextPage } from 'next';
import Link from 'next/link';

const EmailVerifiedPage: NextPage = () => {
  return (
    <div className="container mx-auto mt-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Email Verified</h1>
      <p className="mb-4">Your email has been successfully verified.</p>
      <Link href="/login" className="text-blue-500 hover:underline">
        Click here to sign in
      </Link>
    </div>
  );
};

export default EmailVerifiedPage;
