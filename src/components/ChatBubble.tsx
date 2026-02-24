'use client'

import { Message } from '@/types/car'
import { useMemo } from 'react'

interface Props {
  message: Message
  isStreaming?: boolean
}

// Very simple markdown renderer (no deps)
function renderMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic  
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Unordered lists
    .replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

export default function ChatBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  const html = useMemo(() => {
    if (isUser) return null
    return renderMarkdown(message.content)
  }, [message.content, isUser])

  if (isUser) {
    return (
      <div className="flex justify-end fade-in">
        <div
          className="max-w-[80%] rounded-3xl rounded-tr-md px-4 py-3 text-sm text-white"
          style={{ background: 'var(--bubble-user)' }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start fade-in">
      <div
        className="max-w-[85%] rounded-3xl rounded-tl-md px-4 py-3 text-sm prose-car"
        style={{
          background: 'var(--bubble-ai)',
          color: 'var(--text)',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: html || message.content }} />
        {isStreaming && (
          <span
            className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
            style={{ background: 'var(--accent)' }}
          />
        )}
      </div>
    </div>
  )
}
