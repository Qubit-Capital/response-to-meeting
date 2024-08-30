import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { emailVerified: true },
        $unset: { emailVerificationToken: "" }
      }
    );

    res.redirect('/login?verified=true');
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
}