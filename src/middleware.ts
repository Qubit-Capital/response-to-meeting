import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const isAuth = !!req.nextauth.token;

    const sensitiveRoutes = ['/dashboard'];
    const isAccessingSensitiveRoute = sensitiveRoutes.some((route) =>
      path.startsWith(route)
    );

    if (isAccessingSensitiveRoute && !isAuth) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if ((path === '/' || path === '/login' || path === '/register') && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  },
  {
    callbacks: {
      authorized: () => true, // This allows the middleware to always run
    },
  }
);

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard'],
};
