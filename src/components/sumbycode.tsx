'use client';

import { useState } from 'react';

export default function CodeGenerated() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const summarizeOcrText = (text: string): string => {
    let result = '';

    const company = text.match(/บริษัท\s+(.+?)\s+จำกัด/)?.[1] || 'ไม่พบ';
    const payee = text.match(/Pay to\s+(.*)/)?.[1]?.trim() || 'ไม่พบ';
    const date = text.match(/Date Printed:\s+([\d/]+)/)?.[1] || 'ไม่พบ';
    const bank = text.match(/Bank\s+(.*?)\s+#(\d+)/);
    const bankStr = bank ? `${bank[1]} #${bank[2]}` : 'ไม่พบ';
    const total = text.match(/TOTALS\s+([\d,]+\.\d+)/)?.[1] || '0.00';

    result += `📌 บริษัท: ${company}\n`;
    result += `📌 ผู้รับเงิน: ${payee}\n`;
    result += `📌 วันที่: ${date}\n`;
    result += `📌 ธนาคาร: ${bankStr}\n`;
    result += `📌 รวมยอดเงิน: ${total} บาท\n\n`;

    const accountMap: Record<string, number> = {};
    const entryRegex = /\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*([\d,]+\.\d+)?\s*\|/g;
    const entries = Array.from(text.matchAll(entryRegex));

    result += `🧾 สรุปตามรหัสบัญชี (รวมยอด):\n`;
    for (const entry of entries) {
      const code = entry[2];
      const amount = parseFloat(entry[5]?.replace(/,/g, '') || '0');
      accountMap[code] = (accountMap[code] || 0) + amount;
    }

    for (const code in accountMap) {
      result += `- รหัสบัญชี ${code}: ${accountMap[code].toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท\n`;
    }

    return result;
  };

  const fetchAdvancedSummary = async (text: string): Promise<string> => {
    try {
      const res = await fetch('/api/smart-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText: text }),
      });

      const data = await res.json();

      if (data.error) return `❌ ข้อผิดพลาด: ${data.error}`;

      let summary = `\n\n📊 สรุปบัญชีอัจฉริยะ:\n`;
      summary += `- บริษัท: ${data.company}\n`;
      summary += `- ผู้รับเงิน: ${data.payee}\n`;
      summary += `- วันที่: ${data.date}\n`;
      summary += `- เอกสาร: ${data.doc_no}\n`;
      summary += `- รวมเดบิต: ${data.debit_total.toLocaleString()} บาท\n`;
      summary += `- รวมเครดิต: ${data.credit_total.toLocaleString()} บาท\n`;
      summary += `- สมดุล: ${data.balance_ok ? '✅ สมดุล' : '❌ ไม่สมดุล'}\n`;

      summary += `\n🔍 วิเคราะห์:\n`;
      for (const note of data.insights) {
        summary += `- ${note}\n`;
      }

      return summary;
    } catch {
      return '❌ ไม่สามารถโหลดสรุปแบบเทพได้';
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setOcrText('');
    setSummaryText('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        const base64Image = reader.result.split(',')[1];

        try {
          const res = await fetch('/api/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image }),
          });

          const result = await res.json();

          if (result.error) {
            console.warn('🔁 Google ล้มเหลว → ใช้ Typhoon OCR');

            const fallback = await fetch('/api/typhoon-ocr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: base64Image,
                taskType: 'summary',
                anchorText: 'invoice',
              }),
            });

            const fallbackData = await fallback.json();
            let fallbackText =
              fallbackData?.choices?.[0]?.message?.content?.trim() || '';

            try {
              const parsed = JSON.parse(fallbackText);
              fallbackText = parsed.natural_text || fallbackText;
            } catch {
              console.log('[Typhoon] Not JSON formatted.');
            }

            setOcrText(fallbackText);
            const basic = summarizeOcrText(fallbackText);
            const advanced = await fetchAdvancedSummary(fallbackText);
            setSummaryText(basic + advanced);
          } else {
            const text =
              result.responses?.[0]?.fullTextAnnotation?.text ||
              'ไม่พบข้อความในภาพ';
            setOcrText(text);
            const basic = summarizeOcrText(text);
            const advanced = await fetchAdvancedSummary(text);
            setSummaryText(basic + advanced);
          }
        } catch (err) {
          console.error('[OCR Error]', err);
          setOcrText('เกิดข้อผิดพลาดขณะวิเคราะห์ภาพ');
          setSummaryText('');
        } finally {
          setLoading(false);
        }
      }
    };

    reader.readAsDataURL(image);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        📄 วิเคราะห์เอกสารบัญชีด้วย OCR (Auto Summary + AI)
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
        {loading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ภาพ'}
      </button>

      {ocrText && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-700 mb-2">
            📝 ข้อความที่ตรวจพบจาก OCR:
          </h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
            {ocrText}
          </pre>
        </div>
      )}

      {summaryText && (
        <div className="mt-6">
          <h3 className="font-semibold text-green-700 mb-2">
            🧾 รายงานสรุปบัญชี:
          </h3>
          <pre className="bg-green-50 border border-green-200 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
            {summaryText}
          </pre>
        </div>
      )}
    </div>
  );
}
