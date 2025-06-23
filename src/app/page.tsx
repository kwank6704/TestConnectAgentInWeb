'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  DocumentMagnifyingGlassIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const menuItems = [
    {
      label: 'Home',
      icon: <HomeIcon className="h-5 w-5" />,
      path: '/libs/home',
    },
    {
      label: 'OCR',
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      path: '/libs/ocr',
    },
    {
      label: 'OCR2',
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      path: '/libs/ocr2',
    },
    {
      label: 'OCR3',
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      path: '/libs/ocr3',
    },
    {
      label: 'MILES CHECK by typhoon พอรู้เรื่องแค่ไมล์เลจ',
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      path: '/libs/milescheck',
    },
    {
      label: 'lama โอเคสุด',
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      path: '/libs/lama',
    },
    {
      label: 'SumbyCode แย่มาก',
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      path: '/libs/byCode',
    },
    {
      label: 'deepseek รับได้แต่ข้อความใช้ไม่ได้',
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      path: '/libs/deepseek',
    },
    {
      label: 'ocrMIlesChatGPT',
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      path: '/libs/ocrMIlesChatGPT',
    },
    {
      label: 'Settings',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      path: '/libs/settings',
    },
    
  ];

  return (
    <div className="flex min-h-screen bg-sky-50">

      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-16'
        } bg-white/80 border-r border-sky-100 shadow-sm transition-all duration-300 backdrop-blur`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-sky-100">
          <span
            className={`${
              sidebarOpen ? 'block' : 'hidden'
            } font-bold text-sky-700 text-base tracking-wide`}
          >
            Ditto Demo by Kwan
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-sky-400 hover:text-sky-600 transition"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>
        <nav className="mt-4 space-y-2 text-sm text-sky-700 px-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-sky-100/70 transition text-left"
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-sky-100 via-white to-sky-50 text-sky-900 relative">
        <main className="max-w-2xl text-center px-4 py-16 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-sky-800">
            Demo Web by Intern Kwan
          </h1>
          <p className="text-lg md:text-xl text-sky-600 font-light">
            ทดลองการเชื่อม OCR กับ API ต่างๆ
          </p>

          <button
            onClick={() => router.push('/libs/ocr')}
            className="mt-6 bg-sky-500 hover:bg-sky-600 px-6 py-3 text-white font-medium rounded shadow transition"
          >
            🚀 ไปยังหน้า OCR
          </button>

          <footer className="absolute bottom-6 left-0 right-0 text-sm text-sky-400/70">
            © 2025 OCR Intern Demo Project บริษัท Ditto
          </footer>
        </main>
      </div>
    </div>
  );
}
