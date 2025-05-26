'use client';

import { useState } from 'react';

export default function OCR2() {
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
      formData.append('apikey', 'YOUR_OCR_SPACE_API_KEY'); 
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('file', file);

      try {
        const res = await fetch('https://api.ocr.space/parse/image', {

          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        const parsedText = data?.ParsedResults?.[0]?.ParsedText || 'ไม่พบข้อความ';
        textResults += `\n\n--- File ---\n${parsedText}`;
      } catch (err) {
        textResults += `\n\n--- Error ---\n${err}`;
      }
    }

    setResult(textResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-sky-50 px-6 py-12 text-sky-900">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur rounded-xl shadow-xl p-8 border border-sky-100">
        <h1 className="text-3xl font-bold text-center text-sky-800 mb-6">
          🖼️ OCR Image Reader
        </h1>

        <p className="text-center text-sky-600 mb-6 font-light">
          กรุณาอัปโหลดภาพเพื่อทำ OCR อ่านข้อความจากรูปภาพ
        </p>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile1(e.target.files?.[0] || null)}
            className="border border-sky-200 rounded px-4 py-2 bg-white/70 backdrop-blur"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile2(e.target.files?.[0] || null)}
            className="border border-sky-200 rounded px-4 py-2 bg-white/70 backdrop-blur"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded shadow transition"
        >
          {loading ? 'กำลังประมวลผล...' : 'เริ่มทำ OCR'}
        </button>

        {result && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-sky-700 mb-2">📄 ผลลัพธ์จาก OCR:</h2>
            <pre className="bg-sky-100/60 text-sm p-4 rounded overflow-auto whitespace-pre-wrap border border-sky-200">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}