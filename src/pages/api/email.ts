import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, Db } from 'mongodb';

const ITEMS_PER_PAGE = 20;

let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.DATABASE_URL as string);
  const db = client.db('response-to-meeting');
  cachedDb = db;
  return db;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const db = await connectToDatabase();
      const collection = db.collection('emails');

      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * ITEMS_PER_PAGE;

      const emails = await collection
        .find({})
        .sort({ event_timestamp: -1 })
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .toArray();

      const totalEmails = await collection.countDocuments();
      const totalPages = Math.ceil(totalEmails / ITEMS_PER_PAGE);

      res.status(200).json({
        emails,
        currentPage: page,
        totalPages,
        totalEmails,
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      res.status(500).json({ error: 'Error fetching emails' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}