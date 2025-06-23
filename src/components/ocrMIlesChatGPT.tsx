'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
  filePreviewUrl?: string;
  fileType?: string;
}

export default function OcrMilesChatGPT() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage: Message = { role: 'user', content: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/gpt-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, userMessage],
        }),
      });

      const data = await res.json();
      const gptMessage: Message = {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || 'No response',
      };

      setChatHistory((prev) => [...prev, gptMessage]);
    } catch (error) {
      setChatHistory((prev) => [...prev, {
        role: 'assistant',
        content: 'Error connecting to GPT.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.exe')) {
      alert('❌ ไม่รองรับการอัปโหลดไฟล์ .exe');
      return;
    }

    if (fileName.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const text = XLSX.utils.sheet_to_csv(sheet);

        const fileMessage: Message = {
          role: 'user',
          content: text,
          fileName: file.name,
          fileType: file.type,
        };

        setChatHistory((prev) => [...prev, fileMessage]);
        setMessage('');
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    const fileUrl = URL.createObjectURL(file);

    const fileMessage: Message = {
      role: 'user',
      content: '📎 อัปโหลดไฟล์: ' + file.name,
      fileName: file.name,
      filePreviewUrl: fileUrl,
      fileType: file.type,
    };

    setChatHistory((prev) => [...prev, fileMessage]);

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.gpt,
        };
        setChatHistory((prev) => [...prev, assistantMessage]);
        setMessage('');
      })
      .catch(() => alert('อัปโหลดไฟล์ล้มเหลว'));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'user' ? '#DCF8C6' : '#F1F0F0',
            }}
          >
            {msg.filePreviewUrl && msg.fileType?.startsWith('image') && (
              <img src={msg.filePreviewUrl} alt="uploaded" style={{ maxWidth: '200px', borderRadius: '10px', marginBottom: '5px' }} />
            )}

            {msg.fileName && !msg.fileType?.startsWith('image') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <span>📄</span>
                <strong>{msg.fileName}</strong>
              </div>
            )}

            <div>{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div className="spinner" />
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div style={styles.inputContainer}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.textarea}
          placeholder="Type your message..."
        />
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.exe"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <button onClick={() => fileInputRef.current?.click()} style={styles.fileButton}>📎</button>
        <button onClick={handleSend} style={styles.button}>Send</button>
      </div>

      <style>
        {`
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #10a37f;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            margin: 5px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '600px',
    margin: '0 auto',
    height: '100vh',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
  },
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
  },
  message: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '15px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5',
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  textarea: {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    resize: 'none',
    fontSize: '16px',
    height: '60px',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '10px',
    backgroundColor: '#10a37f',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  fileButton: {
    padding: '10px',
    borderRadius: '10px',
    backgroundColor: '#e0e0e0',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
  },
};
