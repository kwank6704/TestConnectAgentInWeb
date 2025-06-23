import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: req.body.prompt || 'Explain how AI works.',
    });

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    res.status(200).json({ text });
  } catch (error) {
    console.error('[Gemini API error]', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
}
