import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({ subsets: ['thai'], weight: ['400', '600', '700'] });

export const metadata: Metadata = {
  title: 'OCR Demo Web',
  description: 'ทดลองการเชื่อม OCR กับ API ต่างๆ โดย Intern Kwan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${prompt.className} bg-gray-50 text-gray-800`}>
        {children}
      </body>
    </html>
  );
}
