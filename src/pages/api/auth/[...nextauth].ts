import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import { compare } from 'bcryptjs';
import { sendVerificationEmail } from '@/services/emailService';
import crypto from 'crypto';

export default NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await clientPromise;
        const db = client.db();
        const user = await db
          .collection('users')
          .findOne({ email: credentials.email });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    async login({ user, account }) {
      if (account?.provider === 'credentials') {
        const client = await clientPromise;
        const db = client.db();
        const dbUser = await db.collection('users').findOne({ _id: user.id });

        if (!dbUser.emailVerified) {
          const verificationToken = crypto.randomBytes(32).toString('hex');
          await db
            .collection('users')
            .updateOne(
              { _id: dbUser._id },
              { $set: { emailVerificationToken: verificationToken } }
            );
          await sendVerificationEmail(dbUser.email, verificationToken);
          return '/verify-request';
        }
      }
      return true;
    },
  },
  pages: {
    login: '/login',
    verifyRequest: '/verify-request',
  },
  debug: process.env.NODE_ENV === 'development',
});