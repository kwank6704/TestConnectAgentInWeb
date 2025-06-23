'use client';

import { useState } from 'react';

export default function Deepseek() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult('');
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl('');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setResult('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = typeof reader.result === 'string'
        ? reader.result.split(',')[1]
        : '';

      try {
        const res = await fetch('/api/deepseek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'คุณเป็นนักบัญชีมืออาชีพ ช่วยวิเคราะห์เอกสารนี้อย่างละเอียดในเชิงบัญชี',
            base64Image: base64,
            fileType: file.type,
          }),
        });

        const data = await res.json();
        setResult(data.message || '❌ ไม่สามารถวิเคราะห์ได้');
      } catch (err) {
        console.error('[Deepseek Error]', err);
        setResult('❌ เกิดข้อผิดพลาดในการวิเคราะห์');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded mt-10 space-y-4">
      <h2 className="text-xl font-semibold">📄 วิเคราะห์เอกสารบัญชี (DeepSeek)</h2>

      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-2 cursor-pointer bg-gray-50"
      />

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          className="max-w-md border rounded shadow-sm"
        />
      )}

      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '⏳ กำลังวิเคราะห์...' : '📤 วิเคราะห์เอกสาร'}
      </button>

      {result && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded text-sm whitespace-pre-wrap text-gray-800 shadow-sm">
          <strong className="block text-gray-700 mb-2">📋 ผลลัพธ์จาก AI:</strong>
          {result}
        </div>
      )}
    </div>
  );
}
