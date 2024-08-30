import type { AppProps } from 'next/app';
import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '@/styles/globals.css';

function Auth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isUser = !!session?.user;
  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (!isUser && !router.pathname.startsWith('/auth')) router.push('/signin'); // If not authenticated, force log in
    if (isUser && router.pathname === '/signin') router.push('/dashboard'); // If authenticated and on signin page, redirect to dashboard
  }, [isUser, status, router]);

  if (isUser) {
    return children;
  }

  // Session is being fetched, or no user.
  // If no user, useEffect() will redirect.
  return <div>Loading...</div>;
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      {Component.auth ? (
        <Auth>
          <Component {...pageProps} />
        </Auth>
      ) : (
        <Component {...pageProps} />
      )}
    </SessionProvider>
  );
}