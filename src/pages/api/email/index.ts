import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

const ITEMS_PER_PAGE = 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await connectToDatabase();
    const emailCollection = db.collection('emails');

    if (req.method === 'GET') {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const search = req.query.search as string;
        const skip = (page - 1) * ITEMS_PER_PAGE;

        let query = {};
        if (search) {
          query = {
            $or: [
              { from_email: { $regex: search, $options: 'i' } },
              { subject: { $regex: search, $options: 'i' } },
              { sent_message_text: { $regex: search, $options: 'i' } }
            ]
          };
        }

        const emails = await emailCollection
          .find(query)
          .sort({ event_timestamp: -1 })
          .skip(skip)
          .limit(ITEMS_PER_PAGE)
          .toArray();

        const totalEmails = await emailCollection.countDocuments(query);
        const totalPages = Math.ceil(totalEmails / ITEMS_PER_PAGE);

        res.status(200).json({
          emails,
          currentPage: page,
          totalPages,
          totalEmails,
        });
      } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Error fetching emails', details: error.message });
      }
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}