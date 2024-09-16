import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, Db, ObjectId } from 'mongodb';

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

interface LAMEntry {
  _id?: ObjectId;
  actor: string;
  category: string;
  instruction: string;
  createdAt: Date;
  updatedAt: Date;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await connectToDatabase();
  const collection = db.collection<LAMEntry>('lam');

  switch (req.method) {
    case 'GET':
      try {
        const { actor, category } = req.query;
        let query = {};
        if (actor) query = { ...query, actor };
        if (category) query = { ...query, category };
        
        const entries = await collection.find(query).toArray();
        res.status(200).json(entries);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching LAM entries' });
      }
      break;

    case 'POST':
      try {
        const { actor, category, instruction } = req.body;
        if (!actor || !category || !instruction) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const newEntry: LAMEntry = {
          actor,
          category,
          instruction,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await collection.insertOne(newEntry);
        res.status(201).json({ ...newEntry, _id: result.insertedId });
      } catch (error) {
        res.status(500).json({ error: 'Error creating LAM entry' });
      }
      break;

    case 'PUT':
      try {
        const { id, actor, category, instruction } = req.body;
        if (!id || !actor || !category || !instruction) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await collection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              actor, 
              category, 
              instruction,
              updatedAt: new Date(),
            } 
          },
          { returnDocument: 'after' }
        );

        if (result.value) {
          res.status(200).json(result.value);
        } else {
          res.status(404).json({ error: 'LAM entry not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Error updating LAM entry' });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        if (!id) {
          return res.status(400).json({ error: 'Missing id' });
        }

        const result = await collection.deleteOne({ _id: new ObjectId(id as string) });
        if (result.deletedCount === 1) {
          res.status(200).json({ message: 'LAM entry deleted successfully' });
        } else {
          res.status(404).json({ error: 'LAM entry not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Error deleting LAM entry' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}