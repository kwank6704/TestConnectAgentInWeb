'use client';

import { useState } from 'react';

export default function OCR() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [mileage1, setMileage1] = useState<string | null>(null);
  const [mileage2, setMileage2] = useState<string | null>(null);
  const [ocr1, setOcr1] = useState<string | null>(null);
  const [ocr2, setOcr2] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const convertToJpegBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.src = reader.result as string;
      };
      img.onerror = reject;
      reader.onerror = reject;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("canvas context null");

        ctx.drawImage(img, 0, 0);
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        resolve(jpegDataUrl.split(',')[1]);
      };

      reader.readAsDataURL(file);
    });
  };

  const extractMileage = (text: string): string | null => {
    console.log("Raw OCR text:", text);
    try {
      const parsed = JSON.parse(text);
      text = parsed?.natural_text || text;
    } catch (_) {
      console.log("Not a valid JSON format.");
    }

    const odoRegex = /(ODO|odometer)[^\d]{0,10}(\d{4,6})/i;
    const matchOdo = text.match(odoRegex);
    if (matchOdo && matchOdo[2]) {
      console.log("Extracted mileage by ODO pattern:", matchOdo[2]);
      return matchOdo[2];
    }

    const fallback = text.match(/\b\d{5,6}\b/);
    if (fallback) {
      console.log("Fallback mileage extracted:", fallback[0]);
      return fallback[0];
    }

    console.log("Mileage not found.");
    return null;
  };

  const handleUpload = async () => {
    if (!file1 || !file2) {
      alert('กรุณาอัปโหลดรูปภาพทั้ง 2 ไฟล์');
      return;
    }

    setLoading(true);
    setMileage1(null);
    setMileage2(null);
    setOcr1(null);
    setOcr2(null);

    const files = [file1, file2];

    for (let i = 0; i < files.length; i++) {
      console.log(`Processing file ${i + 1}`);
      const file = files[i];
      const base64 = file.type === 'image/png'
        ? await convertToJpegBase64(file)
        : await fileToBase64(file);

      console.log(`Base64 for file ${i + 1} ready`);

      try {
        const ocrRes = await fetch('/api/typhoon-ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            anchorText: 'Sample anchor text from frontend',
            taskType: 'default',
          }),
        });

        const ocrData = await ocrRes.json();
        let ocrText = ocrData?.choices?.[0]?.message?.content?.trim() || '';
        console.log(`OCR result for file ${i + 1}:`, ocrText);

        try {
          const parsed = JSON.parse(ocrText);
          ocrText = parsed.natural_text || ocrText;
          console.log(`Parsed natural_text for file ${i + 1}:`, ocrText);
        } catch (_) {
          console.log("OCR result is not in JSON format.");
        }

        const mileage = extractMileage(ocrText) || 'ไม่พบเลขไมล์';

        if (i === 0) {
          setOcr1(ocrText);
          setMileage1(mileage);
        } else {
          setOcr2(ocrText);
          setMileage2(mileage);
        }

        console.log(`Final extracted mileage for file ${i + 1}:`, mileage);

      } catch (error: any) {
        const fallback = `เกิดข้อผิดพลาด: ${error.message}`;
        console.error(`Error processing file ${i + 1}:`, error.message);
        if (i === 0) {
          setMileage1(fallback);
          setOcr1(fallback);
        } else {
          setMileage2(fallback);
          setOcr2(fallback);
        }
      }
    }

    setLoading(false);
    console.log("All files processed.");
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileSetter: React.Dispatch<React.SetStateAction<File | null>>,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0] || null;
    fileSetter(file);
    previewSetter(file ? URL.createObjectURL(file) : null);
    console.log("File selected:", file?.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-sky-50 px-6 py-12 text-sky-900">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur rounded-xl shadow-xl p-8 border border-sky-100">
        <h1 className="text-3xl font-bold text-center text-sky-800 mb-6">OCR Image Reader (Typhoon)</h1>
        <p className="text-center text-sky-600 mb-6 font-light">
          อัปโหลดภาพเพื่อดึง <strong>เลขไมล์</strong> และ <strong>ข้อความ OCR</strong> จากหน้าปัดรถ
        </p>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFile1, setPreview1)} />
            {preview1 && <img src={preview1} alt="Preview 1" className="mt-2 max-h-60 rounded shadow" />}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFile2, setPreview2)} />
            {preview2 && <img src={preview2} alt="Preview 2" className="mt-2 max-h-60 rounded shadow" />}
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-sky-500 text-white py-2 rounded shadow"
        >
          {loading ? 'กำลังประมวลผล...' : 'เริ่มทำ OCR'}
        </button>

        {(mileage1 || mileage2) && (
          <div className="mt-8 bg-white/70 border border-sky-200 rounded p-4">
            <h2 className="text-lg font-semibold text-sky-700 mb-2">เลขไมล์ที่ตรวจพบ:</h2>
            {mileage1 && <p>ไฟล์ที่ 1: <span className="font-mono text-sky-800">{mileage1} กม.</span></p>}
            {mileage2 && <p>ไฟล์ที่ 2: <span className="font-mono text-sky-800">{mileage2} กม.</span></p>}
          </div>
        )}

        {(ocr1 || ocr2) && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-sky-700 mb-2">ข้อความจาก OCR (Natural Text):</h2>
            {ocr1 && (
              <div className="mb-6">
                <h3 className="font-semibold text-sky-600 mb-1">ไฟล์ที่ 1</h3>
                <pre className="bg-sky-100 text-sm p-4 rounded whitespace-pre-wrap">{ocr1}</pre>
              </div>
            )}
            {ocr2 && (
              <div>
                <h3 className="font-semibold text-sky-600 mb-1">ไฟล์ที่ 2</h3>
                <pre className="bg-sky-100 text-sm p-4 rounded whitespace-pre-wrap">{ocr2}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
