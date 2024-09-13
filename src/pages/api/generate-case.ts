import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { Email } from '@/models/Email';
import { connectToDatabase } from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Memory {
  categories: string[];
  prospectNeeds: string[];
}

const Case = z.object({
  category: z.string(),
  prospect_need: z.string(),
  new_category: z.boolean(),
  new_prospect_need: z.boolean(),
});

async function generateCase(email: Email, memory: Memory) {
  console.log('Memory passed to generateCase:', memory);

  const prompt = `
    Based on the following email exchange, generate a structured case that contains 'category' and 'prospect_need' fields. This case will later be used to create specific AI prompts for generating accurate email responses.

    Email sent by the user:
    ""
    ${email.sent_message_text}
    ""
    
    Email received from the prospect:
    ""
    ${email.reply_message_text}
    ""
    Definitions:

    Category: The category encapsulates the general scenario or context of the received email in 2-3 words. It describes the nature of the request or topic of discussion. Examples include 'Book a Meeting', 'Out of Office', 'Not Interested', etc.
    Prospect_need: The prospect need specifies the action or information that the prospect is looking for in a short sentence. It describes what info the user needs to deliver to satisfy the prospect's request, such as 'Need for New Point of Contact', 'Share the agenda for the meeting', 'Give more info about past success in similar domain', etc.
    
    Guidelines:

    Both 'category' and 'prospect_need' should be extracted from the email received from the prospect and are independent of each other.
    Ensure that the 'category' and 'prospect_need' are accurate but general enough to be applicable to similar email exchanges.
    Exclude specific names, emails, company names, etc., from 'category' and 'prospect_need'.
    It is possible that only one of the 'category' or 'prospect_need' matches an existing value, while the other needs to be newly defined.
    If there are no existing categories or prospect needs, you MUST generate new one respectively.
    In case, the main email body of the email received is HTML (apart from the signature) and seems like system generated instead of human generated, category should be "System generated email".
    In case, the email received is mostly in some other language than English, category should be "Email in foreign language".

    Existing categories:
    ${memory.categories.join(', ')}

    Existing prospect needs:
    ${memory.prospectNeeds.join(', ')}

    Task:

    Identify the most relevant category from the existing list or generate a new one if no relevant match is found.
    Identify the most relevant prospect need from the existing list or generate a new one if no relevant match is found.
    If there are no existing prospect needs, you MUST generate a new one.
    Whenever a new category is generated apart from the existing ones, new_category must be true, otherwise false.
    Whenever a new prospect need is generated apart from the existing ones, new_prospect_need must be true, otherwise false.
  `;

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI assistant that generates structured cases based on email exchanges." },
        { role: "user", content: prompt }
      ],
      response_format: zodResponseFormat(Case, "generate_case"),
    });

    return completion.choices[0].message.parsed;
  } catch (error) {
    console.error('Error generating case:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { db } = await connectToDatabase();
      const { email } = req.body;

      // Fetch categories and prospect needs from MongoDB
      const categories = await db.collection('categories').find().toArray();
      const prospectNeeds = await db.collection('prospectNeeds').find().toArray();

      console.log('Categories from DB:', categories);
      console.log('Prospect needs from DB:', prospectNeeds);

      const memory: Memory = {
        categories: categories.map(c => c.name),
        prospectNeeds: prospectNeeds.map(p => p.name)
      };

      console.log('Memory object:', memory);

      const generatedCase = await generateCase(email as Email, memory);
      
      console.log('Generated case from OpenAI:', generatedCase);

      // Validate and correct new_category and new_prospect_need
      const validatedCase = generatedCase ? {
        ...generatedCase,
        new_category: !memory.categories.includes(generatedCase.category),
        new_prospect_need: !memory.prospectNeeds.includes(generatedCase.prospect_need)
      } : null;

      if (!validatedCase) {
        throw new Error('Failed to generate case');
      }

      console.log('Validated case:', validatedCase);

      // Update the database if there are new categories or prospect needs
      if (validatedCase.new_category) {
        console.log(`Updating memory: Adding new category "${validatedCase.category}"`);
        await db.collection('categories').updateOne(
          { name: validatedCase.category },
          { $setOnInsert: { name: validatedCase.category } },
          { upsert: true }
        );
      } else {
        console.log(`Category "${validatedCase.category}" already exists in memory`);
      }

      if (validatedCase.new_prospect_need) {
        console.log(`Updating memory: Adding new prospect need "${validatedCase.prospect_need}"`);
        await db.collection('prospectNeeds').updateOne(
          { name: validatedCase.prospect_need },
          { $setOnInsert: { name: validatedCase.prospect_need } },
          { upsert: true }
        );
      } else {
        console.log(`Prospect need "${validatedCase.prospect_need}" already exists in memory`);
      }

      // Fetch updated memory after potential changes
      const updatedCategories = await db.collection('categories').find().toArray();
      const updatedProspectNeeds = await db.collection('prospectNeeds').find().toArray();

      console.log('Updated categories in DB:', updatedCategories);
      console.log('Updated prospect needs in DB:', updatedProspectNeeds);

      res.status(200).json({ case: validatedCase });
    } catch (error) {
      console.error('Error generating case:', error);
      res.status(500).json({ error: 'Failed to generate case' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}