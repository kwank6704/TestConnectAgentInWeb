import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ocrText } = req.body;

  if (!ocrText) {
    return res.status(400).json({ error: 'OCR text is required' });
  }

  // ✅ สร้างไฟล์ OCR ชั่วคราว
  const scriptPath = path.join(process.cwd(), 'scripts', 'account_summary.py');
  const tempFile = path.join(process.cwd(), 'scripts', 'temp_input.txt');
  fs.writeFileSync(tempFile, ocrText, 'utf-8');

  // ✅ ระบุ path Python ตรง (ที่คุณได้จาก Get-Command)
  const pythonPath = "C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";

  // ✅ เพิ่ม encoding UTF-8 ให้ Python stdout เสมอ
  const command = `"${pythonPath}" "${scriptPath}" "${tempFile}"`;

  exec(command, { encoding: 'utf-8' }, (err, stdout, stderr) => {
    console.log("===== PYTHON STDOUT =====");
    console.log(stdout);
    console.log("===== PYTHON STDERR =====");
    console.log(stderr);

    if (err) {
      console.error('[Python error]', err);
      return res.status(500).json({ error: 'Error executing Python script', stderr });
    }

    try {
      const parsed = JSON.parse(stdout);
      return res.status(200).json(parsed);
    } catch (e) {
      console.error('[JSON parse error]', e);
      return res.status(500).json({ error: 'Invalid JSON from Python script', raw: stdout });
    }
  });
}
