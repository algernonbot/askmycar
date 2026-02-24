'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Message } from '@/types/car'
import { getCarById, getSession, appendMessage, clearSession } from '@/lib/storage'
import { nanoid } from 'nanoid'
import ChatBubble from '@/components/ChatBubble'
import ChatInput from '@/components/ChatInput'

const SUGGESTED_QUESTIONS = [
  'What does the orange warning light mean?',
  'How often should I change my oil?',
  'What\'s the tire pressure for my car?',
  'How do I reset the maintenance reminder?',
]

export default function CarChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [car, setCar] = useState<Car | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [toolInUse, setToolInUse] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const c = getCarById(id)
    if (!c) { router.push('/'); return }
    setCar(c)
    const session = getSession(id)
    setMessages(session.messages)
  }, [id, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, toolInUse])

  const sendMessage = async (text: string) => {
    if (!car || streaming) return

    const userMsg: Message = {
      id: nanoid(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    appendMessage(car.id, userMsg)
    setStreaming(true)
    setStreamingText('')
    setToolInUse(null)

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ car, messages: apiMessages }),
      })

      if (!res.ok) throw new Error('Chat request failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'tool') {
              const toolNames: Record<string, string> = {
                fetch_manual: '📖 Reading your manual...',
                web_search: '🔍 Searching the web...',
              }
              setToolInUse(toolNames[event.name] || 'Thinking...')
            } else if (event.type === 'text') {
              fullText = event.content
              setStreamingText(fullText)
              setToolInUse(null)
            } else if (event.type === 'done') {
              if (fullText) {
                const aiMsg: Message = {
                  id: nanoid(),
                  role: 'assistant',
                  content: fullText,
                  timestamp: new Date().toISOString(),
                }
                setMessages(prev => [...prev, aiMsg])
                appendMessage(car.id, aiMsg)
              }
              setStreamingText('')
              setToolInUse(null)
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch (parseError) {
            // skip malformed events
          }
        }
      }
    } catch (e) {
      const errMsg: Message = {
        id: nanoid(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
      appendMessage(car.id, errMsg)
    } finally {
      setStreaming(false)
      setStreamingText('')
      setToolInUse(null)
    }
  }

  if (!mounted || !car) return null

  const displayName = car.nickname || `${car.year} ${car.make} ${car.model}`

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.push('/')}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}
          aria-label="Back"
        >
          ‹
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ color: 'var(--text)', fontSize: '16px' }}>
            {displayName}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {car.trim ? `${car.trim} · ` : ''}{car.engine || `${car.year} ${car.make}`}
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { clearSession(car.id); setMessages([]) }}
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}
          >
            Clear
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !streaming && (
          <WelcomeScreen car={car} onQuestion={sendMessage} />
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Tool indicator */}
        {toolInUse && (
          <div className="flex items-center gap-2 fade-in" style={{ color: 'var(--text-tertiary)' }}>
            <span className="text-sm">{toolInUse}</span>
            <span className="dot-1">·</span>
            <span className="dot-2">·</span>
            <span className="dot-3">·</span>
          </div>
        )}

        {/* Streaming response */}
        {streamingText && (
          <ChatBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingText,
              timestamp: new Date().toISOString(),
            }}
            isStreaming
          />
        )}

        {/* Typing indicator (before first text arrives) */}
        {streaming && !streamingText && !toolInUse && (
          <div className="flex gap-1 items-center py-3 px-1">
            <span className="w-2 h-2 rounded-full dot-1" style={{ background: 'var(--text-tertiary)' }} />
            <span className="w-2 h-2 rounded-full dot-2" style={{ background: 'var(--text-tertiary)' }} />
            <span className="w-2 h-2 rounded-full dot-3" style={{ background: 'var(--text-tertiary)' }} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={streaming} />
    </div>
  )
}

function WelcomeScreen({ car, onQuestion }: { car: Car; onQuestion: (q: string) => void }) {
  return (
    <div className="pt-6 pb-4 fade-in">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">👋</div>
        <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
          Ask me anything about your {car.make}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          I know your owner's manual inside and out.
        </p>
      </div>
      <div className="space-y-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onQuestion(q)}
            className="w-full text-left px-4 py-3 rounded-2xl text-sm active:scale-98"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text)',
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
