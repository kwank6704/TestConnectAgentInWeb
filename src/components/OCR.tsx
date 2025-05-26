'use client';

import { useState } from 'react';

export default function OCR() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleUpload = async () => {
    if (!file1 || !file2) return alert('กรุณาอัปโหลดรูปภาพทั้ง 2 ไฟล์');

    setLoading(true);
    const files = [file1, file2];
    let textResults = '';

    for (let file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/typhoon-ocr', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        textResults += `\n\n--- File ---\n${data.result || 'ไม่พบข้อความ'}`;
      } catch (err: any) {
        textResults += `\n\n--- Error ---\n${err.message}`;
      }
    }

    setResult(textResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-sky-50 px-6 py-12 text-sky-900">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur rounded-xl shadow-xl p-8 border border-sky-100">
        <h1 className="text-3xl font-bold text-center text-sky-800 mb-6">🖼️ OCR Image Reader (Typhoon)</h1>
        <p className="text-center text-sky-600 mb-6 font-light">อัปโหลดภาพเพื่ออ่านข้อความด้วย Typhoon OCR</p>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <input type="file" accept="image/*" onChange={(e) => setFile1(e.target.files?.[0] || null)} />
          <input type="file" accept="image/*" onChange={(e) => setFile2(e.target.files?.[0] || null)} />
        </div>

        <button onClick={handleUpload} disabled={loading} className="w-full bg-sky-500 text-white py-2 rounded shadow">
          {loading ? 'กำลังประมวลผล...' : 'เริ่มทำ OCR'}
        </button>

        {result && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-sky-700 mb-2">📄 ผลลัพธ์จาก Typhoon OCR:</h2>
            <pre className="bg-sky-100 text-sm p-4 rounded whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
