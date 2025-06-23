import type { NextApiRequest, NextApiResponse } from 'next';
import { extractOdometerFromBase64 } from '@/app/libs/ocr2/crop0do'; // ปรับเส้นทางให้ตรงกับโครงสร้างโปรเจกต์ของคุณ

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64' });
  }

  try {
    const mileage = await extractOdometerFromBase64(imageBase64);
    return res.status(200).json({ mileage });
  } catch (error) {
    console.error('OCR error:', error);
    return res.status(500).json({ error: 'Failed to extract mileage' });
  }
}
