import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, Db } from 'mongodb';

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
  const db = await connectToDatabase();
  const collection = db.collection('categories');

  switch (req.method) {
    case 'GET':
      try {
        const categories = await collection.find().toArray();
        res.status(200).json(categories);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching categories' });
      }
      break;

    case 'POST':
      try {
        const { name } = req.body;
        const result = await collection.insertOne({ name });
        res.status(201).json({ 
          insertedId: result.insertedId,
          name: name
        });
      } catch (error) {
        res.status(500).json({ error: 'Error creating category' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}