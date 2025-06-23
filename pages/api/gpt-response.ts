import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: req.body.messages,
      temperature: 1,
      max_tokens: 50000,
      top_p: 1,
    });

    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
