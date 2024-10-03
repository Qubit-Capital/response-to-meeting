import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await connectToDatabase();
    const emailCollection = db.collection('emails');
    const categoryCollection = db.collection('categories');

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid email ID' });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid email ID format' });
    }

    switch (req.method) {
      case 'GET':
        try {
          const email = await emailCollection.findOne({ _id: objectId });
          if (!email) {
            return res.status(404).json({ error: 'Email not found' });
          }
          res.status(200).json(email);
        } catch (error) {
          console.error('Error fetching email:', error);
          res.status(500).json({ error: 'Error fetching email', details: error.message });
        }
        break;

      case 'PATCH':
        try {
          const updateData = req.body;

          // Validate category if it's being updated
          if (updateData.category) {
            const category = await categoryCollection.findOne({ _id: new ObjectId(updateData.category.id) });
            if (!category) {
              return res.status(400).json({ error: 'Invalid category ID' });
            }
            if (category.name !== updateData.category.name) {
              return res.status(400).json({ error: 'Category name does not match ID' });
            }
            // Update the category in updateData to include both id and name
            updateData.category = {
              id: category._id,
              name: category.name
            };
          }

          const result = await emailCollection.updateOne(
            { _id: objectId },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Email not found' });
          }

          res.status(200).json({ message: 'Email updated successfully', result });
        } catch (error) {
          res.status(500).json({ error: 'Error updating email', details: error.message });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'PATCH']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}