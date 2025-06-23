'use client';

import { useState, useEffect } from 'react';

export default function MilesCheckTyphoon() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [mileage1, setMileage1] = useState<string | null>(null);
  const [mileage2, setMileage2] = useState<string | null>(null);
  const [ocr1, setOcr1] = useState<string | null>(null);
  const [ocr2, setOcr2] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [employeeCode, setEmployeeCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [date, setDate] = useState('');

  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const RATE_PER_KM = 6;

  useEffect(() => {
    if (mileage1 && mileage2) {
      let start = parseInt(mileage1);
      let end = parseInt(mileage2);
      if (!isNaN(start) && !isNaN(end)) {
        if (start > end) {
          [start, end] = [end, start];
        }

        const distance = end - start;
        const cost = distance * RATE_PER_KM;
        setTotalDistance(distance);
        setTotalCost(cost);
        setMileage1(start.toString());
        setMileage2(end.toString());

        if (cost > 4000) {
          alert('ค่าเดินทางเกิน 4,000 บาท กรุณาติดต่อ ดร.สรัสไชย องค์ประเสริฐ โทร. 0987654321');
        }
      }
    }
  }, [mileage1, mileage2]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const convertToJpegBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => (img.src = reader.result as string);
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
    try {
      const parsed = JSON.parse(text);
      text = parsed?.natural_text || text;
    } catch (_) {}

    const odoRegex = /(ODO|odometer)[^\d]{0,10}(\d{4,6})/i;
    const matchOdo = text.match(odoRegex);
    if (matchOdo && matchOdo[2]) return matchOdo[2];

    const fallback = text.match(/\b\d{5,6}\b/);
    if (fallback) return fallback[0];

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
      const file = files[i];
      const base64 = file.type === 'image/png'
        ? await convertToJpegBase64(file)
        : await fileToBase64(file);

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
        try {
          const parsed = JSON.parse(ocrText);
          ocrText = parsed.natural_text || ocrText;
        } catch (_) {}

        const mileage = extractMileage(ocrText) || 'ไม่พบเลขไมล์';

        if (i === 0) {
          setOcr1(ocrText);
          setMileage1(mileage);
        } else {
          setOcr2(ocrText);
          setMileage2(mileage);
        }
      } catch (error: any) {
        const fallback = `เกิดข้อผิดพลาด: ${error.message}`;
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
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileSetter: React.Dispatch<React.SetStateAction<File | null>>,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0] || null;
    fileSetter(file);
    previewSetter(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-sky-50 px-6 py-12 text-sky-900">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur rounded-xl shadow-xl p-8 border border-sky-100">
        <h1 className="text-3xl font-bold text-center text-sky-800 mb-6">OCR Image Reader (Typhoon)</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFile1, setPreview1)} />
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFile2, setPreview2)} />
          {preview1 && <img src={preview1} alt="Preview 1" className="mt-2 max-h-60 rounded shadow col-span-1" />}
          {preview2 && <img src={preview2} alt="Preview 2" className="mt-2 max-h-60 rounded shadow col-span-1" />}
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-sky-500 text-white py-2 rounded shadow hover:bg-sky-600"
        >
          {loading ? 'กำลังประมวลผล...' : 'เริ่มทำ OCR'}
        </button>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/70 border border-sky-200 rounded p-4">
          <input placeholder="รหัสพนักงาน" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} className="p-2 border rounded" />
          <input placeholder="ชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="p-2 border rounded" />
          <input placeholder="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} className="p-2 border rounded" />
          <input placeholder="จุดเริ่มต้น" value={startPoint} onChange={(e) => setStartPoint(e.target.value)} className="p-2 border rounded" />
          <input placeholder="จุดสิ้นสุด" value={endPoint} onChange={(e) => setEndPoint(e.target.value)} className="p-2 border rounded" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 border rounded" />
        </div>

        {(totalDistance !== null && totalCost !== null) && (
          <div className="mt-8 bg-white/80 border border-sky-300 rounded p-6 shadow-inner">
            <h2 className="text-xl font-bold text-sky-800 mb-4">ผลการคำนวณ</h2>
            <p className="mb-2">เลขไมล์เริ่มต้น: <span className="font-mono">{mileage1} กม.</span></p>
            <p className="mb-2">เลขไมล์สิ้นสุด: <span className="font-mono">{mileage2} กม.</span></p>
            <p className="mb-2">ระยะทางรวม: <span className="font-semibold">{totalDistance} กม.</span></p>
            <p className="mb-2">ค่าตอบแทน: <span className={`font-bold ${totalCost > 4000 ? 'text-red-600' : 'text-green-700'}`}>{totalCost.toLocaleString()} บาท</span></p>
          </div>
        )}

        {(ocr1 || ocr2) && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-sky-700 mb-2">ข้อความจาก OCR</h2>
            {ocr1 && <div className="mb-4"><h3 className="text-sky-600 font-semibold">ไฟล์ที่ 1</h3><pre className="bg-sky-100 p-4 rounded text-sm whitespace-pre-wrap">{ocr1}</pre></div>}
            {ocr2 && <div><h3 className="text-sky-600 font-semibold">ไฟล์ที่ 2</h3><pre className="bg-sky-100 p-4 rounded text-sm whitespace-pre-wrap">{ocr2}</pre></div>}
          </div>
        )}
      </div>
    </div>
  );
}
