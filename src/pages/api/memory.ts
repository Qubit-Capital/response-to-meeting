import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    const { db } = await connectToDatabase();

    switch (method) {
      case 'GET':
        try {
          const categories = await db.collection('categories').find().toArray();
          const prospectNeeds = await db.collection('prospectNeeds').find().toArray();
          console.log('Current categories:', categories);
          console.log('Current prospect needs:', prospectNeeds);
          res.status(200).json({ categories, prospectNeeds });
        } catch (error) {
          console.error('Error fetching memory data:', error);
          res.status(500).json({ error: 'Error fetching memory data', details: error.message });
        }
        break;

      case 'POST':
        try {
          const { category, prospectNeed } = req.body;
          if (category) {
            await db.collection('categories').updateOne(
              { name: category },
              { $setOnInsert: { name: category } },
              { upsert: true }
            );
          }
          if (prospectNeed) {
            await db.collection('prospectNeeds').updateOne(
              { name: prospectNeed },
              { $setOnInsert: { name: prospectNeed } },
              { upsert: true }
            );
          }
          res.status(200).json({ message: 'Memory updated successfully' });
        } catch (error) {
          res.status(500).json({ error: 'Error updating memory data' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({ error: 'Error connecting to database', details: error.message });
  }
}