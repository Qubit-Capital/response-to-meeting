import { NextPage } from 'next';

const VerifyRequestPage: NextPage = () => {
  return (
    <div className="container mx-auto mt-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Check your email</h1>
      <p className="mb-2">
        A verification link has been sent to your email address.
      </p>
      <p>
        Please check your email and click on the link to verify your account.
      </p>
    </div>
  );
};

export default VerifyRequestPage;
