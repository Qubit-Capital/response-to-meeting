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
  if (req.method === 'GET') {
    try {
      const db = await connectToDatabase();
      const instructionTemplates = await db.collection('instruction_templates').aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $lookup: {
            from: 'user_needs',
            localField: 'user_need_id',
            foreignField: '_id',
            as: 'user_need'
          }
        },
        {
          $unwind: '$category'
        },
        {
          $unwind: '$user_need'
        }
      ]).toArray();

      res.status(200).json(instructionTemplates);
    } catch (error) {
      console.error('Error fetching instruction templates:', error);
      res.status(500).json({ error: 'Error fetching instruction templates' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}