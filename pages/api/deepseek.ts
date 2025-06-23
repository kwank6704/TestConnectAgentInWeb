import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // รองรับภาพ/ไฟล์ใหญ่
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, base64Image, fileType } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const hfRes = await fetch('https://router.huggingface.co/novita/v3/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'DeepSeek-R1',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...(base64Image
                ? [{
                    type: 'image_url',
                    image_url: {
                      url: `data:${fileType};base64,${base64Image}`,
                    },
                  }]
                : [])
            ],
          },
        ],
      }),
    });

    const raw = await hfRes.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error('[DeepSeek Response is not JSON]', raw);
      return res.status(502).json({ error: 'Invalid response from HuggingFace' });
    }

    if (!hfRes.ok) {
      return res.status(hfRes.status).json({ error: data.error || 'HuggingFace API failed' });
    }

    return res.status(200).json({
      message: data.choices?.[0]?.message?.content || '',
    });
  } catch (err) {
    console.error('[DeepSeek API Error]', err);
    return res.status(500).json({ error: 'Fetch failed or server unreachable' });
  }
}
