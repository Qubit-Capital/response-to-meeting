import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ILearningActingMemory } from "@/models/LearningActingMemory";
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await connectToDatabase();
  const collection = db.collection<ILearningActingMemory>('lam');

  switch (req.method) {
    case 'GET':
      try {
        const { actor, category } = req.query;
        let query: any = {};
        if (actor) query.actor = actor;
        if (category) {
          query['categories.id'] = category;
        }
        
        const entries = await collection.find(query).toArray();
        res.status(200).json(entries);
      } catch (error) {
        res.status(500).json({ error: 'Error fetching LAM entries' });
      }
      break;

    case 'POST':
      try {
        const { actor, scenario, categories, instruction } = req.body;
        console.log('Received POST request with body:', JSON.stringify(req.body, null, 2));

        if (!actor || !scenario || !categories || !instruction) {
          console.log('Missing required fields');
          return res.status(400).json({ error: 'Missing required fields' });
        }

        let validatedCategories;
        if (Array.isArray(categories) && categories.length === 1 && categories[0] === '*') {
          validatedCategories = [{ id: '*', name: 'All Categories' }];
        } else if (Array.isArray(categories) && categories.length > 0) {
          validatedCategories = categories;
        } else {
          console.log('Invalid categories:', categories);
          return res.status(400).json({ error: 'Invalid categories' });
        }

        const newEntry: Omit<ILearningActingMemory, '_id'> = {
          actor,
          scenario,
          categories: validatedCategories,
          instruction,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log('Attempting to insert new entry:', JSON.stringify(newEntry, null, 2));

        const result = await collection.insertOne(newEntry);
        console.log('Insert result:', result);

        res.status(201).json({ ...newEntry, _id: result.insertedId });
      } catch (error) {
        console.error('Error in POST /api/lam:', error);
        res.status(500).json({ error: 'Error creating LAM entry', details: error.message });
      }
      break;

    case 'PUT':
      try {
        const { id, actor, scenario, categories, instruction } = req.body;
        if (!id || !actor || !scenario || !categories || !instruction) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        let validatedCategories;
        if (Array.isArray(categories) && categories.length === 1 && categories[0] === '*') {
          validatedCategories = [{ id: '*', name: 'All Categories' }];
        } else if (Array.isArray(categories) && categories.length > 0) {
          validatedCategories = categories;
        } else {
          return res.status(400).json({ error: 'Invalid categories' });
        }

        const result = await collection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              actor, 
              scenario,
              categories: validatedCategories, 
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