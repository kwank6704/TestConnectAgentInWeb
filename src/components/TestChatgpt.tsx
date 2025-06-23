'use client'

import React, { useState } from 'react'

interface ChatGptBoxProps {
  title?: string
}

const ChatGptBox: React.FC<ChatGptBoxProps> = ({ title = 'Chat with GPT' }) => {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const callChatGpt = async () => {
    setLoading(true)
    setResponse('')
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}` // อย่าลืมสร้าง .env.local
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: message }]
        })
      })

      const data = await res.json()
      setResponse(data.choices?.[0]?.message?.content || 'No response')
    } catch (error) {
      setResponse('Error occurred: ' + (error as Error).message)
    }
    setLoading(false)
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: 8 }}>
      <h3>{title}</h3>
      <textarea
        rows={4}
        placeholder="Ask something..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: '100%' }}
      />
      <button onClick={callChatGpt} disabled={loading} style={{ marginTop: '0.5rem' }}>
        {loading ? 'Loading...' : 'Send'}
      </button>
      <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{response}</div>
    </div>
  )
}

export default ChatGptBox
