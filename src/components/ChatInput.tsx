'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [text])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex-shrink-0 px-4 py-3 safe-bottom"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
    >
      <div
        className="flex items-end gap-2 rounded-2xl px-4 py-2"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your car..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed py-1"
          style={{
            color: 'var(--text)',
            minHeight: '24px',
            maxHeight: '120px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 active:scale-90 disabled:opacity-30 transition-all"
          style={{ background: 'var(--accent)' }}
          aria-label="Send"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <p className="text-xs text-center mt-2" style={{ color: 'var(--text-tertiary)' }}>
        Powered by your owner's manual + Claude AI
      </p>
    </div>
  )
}
