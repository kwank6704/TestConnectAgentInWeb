import type { NextApiRequest, NextApiResponse } from 'next';
import { formidable } from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import * as Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const form = formidable({ keepExtensions: true });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = file.filepath;
    const fileName = file.originalFilename?.toLowerCase() || '';
    let extractedText = '';

    if (fileName.endsWith('.pdf')) {
      const data = fs.readFileSync(filePath);
      const pdf = await pdfParse(data);
      extractedText = pdf.text;
    } else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) {
      const result = await Tesseract.recognize(filePath, 'eng');
      extractedText = result.data.text;
    } else {
      return res.status(400).json({ error: 'ไฟล์ไม่รองรับ' });
    }

    if (!extractedText.trim()) {
      return res.status(200).json({ text: '', gpt: 'ไม่พบข้อความในไฟล์' });
    }

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `ช่วยสรุปหรืออธิบายเนื้อหานี้:\n\n${extractedText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const gptText = gptResponse.choices[0].message?.content || 'GPT ไม่สามารถตอบได้';

    res.status(200).json({
      text: extractedText,
      gpt: gptText,
    });

  } catch (err: any) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลไฟล์', detail: err.message });
  }
}
