import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/novita/v3/openai",
  apiKey: process.env.HF_API_KEY!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, base64Image } = req.body;

  const defaultPrompt = `
คุณเป็นนักบัญชีที่ได้รับมอบหมายให้วิเคราะห์เอกสาร Payment Journal นี้ กรุณาดึงข้อมูลและจัดให้อยู่ในรูปแบบ JSON ที่สามารถนำเข้าระบบบัญชีได้ทันที โดยมีโครงสร้างดังนี้:

{
  "document_number": "",
  "posting_date": "",
  "printed_date": "",
  "payee": "",
  "payment_method": "",
  "bank": "",
  "total_amount": "",
  "currency": "",
  "transactions": [
    {
      "account_number": "",
      "account_name": "",
      "description": "",
      "debit": "",
      "credit": "",
      "dimension": ""
    }
  ],
  "summary_text": "..."
}

โปรดตอบกลับเฉพาะ JSON เท่านั้น ห้ามมีคำอธิบายอื่นนอก JSON
`;



  try {
    const chatCompletion = await client.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt ||defaultPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    res.status(200).json({
      text: chatCompletion.choices?.[0]?.message?.content || 'ไม่สามารถวิเคราะห์ภาพได้',
    });
  } catch (error) {
    console.error("[HF Chat Error]", error);
    res.status(500).json({ text: "เกิดข้อผิดพลาด", error });
  }
}
