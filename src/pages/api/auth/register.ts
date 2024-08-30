import { NextApiRequest, NextApiResponse } from 'next';
import { hash } from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendVerificationEmail } from '@/services/emailService';
import crypto from 'crypto';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password and verification token
    const hashedPassword = await hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user: User = {
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
      emailVerificationToken: verificationToken,
    };

    const result = await db.collection('users').insertOne(user);

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertedId,
      redirectTo: `/verify-request?email=${encodeURIComponent(email)}`,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
