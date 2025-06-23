'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'image'
}

export default function ChatGptMultiModal() {
  const [input, setInput] = useState('')
  const [chat, setChat] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'text' | 'image'>('text')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, loading])

  const sendMessage = async () => {
    if (!input.trim()) return
    setLoading(true)

    const userMsg: Message = { role: 'user', content: input, type: 'text' }
    setChat((prev) => [...prev, userMsg])

    try {
      if (mode === 'text') {
        const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: input }]
          })
        })

        const chatData = await chatRes.json()
        const textResponse = chatData.choices?.[0]?.message?.content ?? 'No response'
        setChat((prev) => [...prev, { role: 'assistant', content: textResponse, type: 'text' }])
      }

      if (mode === 'image') {
        const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: input,
            size: '1024x1024',
            n: 1
          })
        })

        const imageData = await imageRes.json()
        const imageUrl = imageData?.data?.[0]?.url

        if (imageUrl) {
          setChat((prev) => [...prev, { role: 'assistant', content: imageUrl, type: 'image' }])
        } else {
          setChat((prev) => [...prev, { role: 'assistant', content: '❌ Failed to generate image.', type: 'text' }])
        }
      }
    } catch (err: any) {
      setChat((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Error: ' + err.message, type: 'text' }
      ])
    }

    setLoading(false)
    setInput('')
  }

  return (
    <div className="max-w-3xl mx-auto h-[90vh] flex flex-col border rounded shadow bg-white">
      <div className="bg-sky-700 text-white font-bold text-center py-3 text-lg">
        แชทกับเอไอที่ฉลาดที่สุด (เอไอหัวแถว)
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] p-3 rounded-lg shadow ${
                msg.role === 'user'
                  ? 'bg-sky-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {msg.type === 'image' ? (
                <img src={msg.content} alt="Generated" className="rounded border" />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-sm text-sky-400 italic">AI is typing...</div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="flex gap-2 w-full">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'text' | 'image')}
              className="border rounded px-2 py-1 text-sm text-gray-700"
            >
              <option value="text">Chat (Text)</option>
              <option value="image">Generate Image</option>
            </select>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type something..."
              className="flex-1 border rounded px-3 py-2 text-sm focus:ring-sky-300 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-sky-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
