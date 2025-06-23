import { createWorker } from 'tesseract.js';

export async function extractOdometerFromBase64(base64: string): Promise<string> {
  const worker = await createWorker('eng');

  const cropped = await cropOdoArea(base64); // Placeholder: จะทำในขั้นถัดไป
  const { data } = await worker.recognize(cropped);
  await worker.terminate();

  const match = data.text.match(/\b\d{5,6}\b/);
  return match ? match[0] : 'ไม่พบเลขไมล์';
}

// Dummy: คุณต้องใช้ image-processing เพื่อครอปใน Base64 หรือส่งมาเฉพาะจุดใน frontend
async function cropOdoArea(base64: string): Promise<string> {
  return `data:image/png;base64,${base64}`; // จริง ๆ ต้องครอปตรงกลาง
}
