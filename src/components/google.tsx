'use client';

import { useState } from 'react';

export default function GoogleVision() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultText, setResultText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultText('');
    }
  };

  const analyzeImage = async (base64Image: string) => {
    try {
      const res = await fetch('/api/image-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'อธิบายภาพนี้เป็นภาษาไทยอย่างละเอียดแบบนักบัญชีมืออาชีพ',
          base64Image,
        }),
      });

      const data = await res.json();
      setResultText(data.text || '❌ ไม่สามารถวิเคราะห์ภาพได้');
    } catch (err) {
      console.error('[Analyze Error]', err);
      setResultText('❌ เกิดข้อผิดพลาดในการวิเคราะห์ภาพ');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setResultText('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        const base64Image = reader.result.split(',')[1];
        await analyzeImage(base64Image);
      }
    };

    reader.readAsDataURL(image);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        🧠 วิเคราะห์ภาพด้วย AI (LLaMA-4 + Hugging Face)
      </h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
      />

      {previewUrl && (
        <div className="mb-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full max-w-md rounded shadow border"
          />
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '🔄 กำลังวิเคราะห์...' : '📷 วิเคราะห์ภาพ'}
      </button>

      {resultText && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-2">
            📝 คำอธิบายจาก AI:
          </h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm text-sm text-gray-900 space-y-2 leading-relaxed">
            {resultText.split('\n').map((line, i) => (
              <p key={i}>
                {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                  /^\*\*.*\*\*$/.test(part) ? (
                    <strong key={j} className="text-gray-800">
                      {part.replace(/\*\*/g, '')}
                    </strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
