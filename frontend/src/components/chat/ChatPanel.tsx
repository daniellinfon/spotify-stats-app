import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

const SUGGESTED_PROMPTS = [
  '¿Cuáles son mis artistas favoritos?',
  '¿Qué canciones he escuchado más?',
  'Crea una playlist con mis tops del último mes',
  '¿Qué género musical domina mi perfil?',
]

const THINKING_MESSAGES = [
  '🎵 Analizando tu música...',
  '🔍 Consultando Spotify...',
  '🎧 Procesando tus datos...',
  '✨ Preparando respuesta...',
]

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu DJ personal 🎵 Puedo analizar tu música y crear playlists. ¿En qué te ayudo?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [thinkingMsg, setThinkingMsg] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const thinkingInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Rota los mensajes de "pensando" mientras el agente trabaja
  useEffect(() => {
    if (isLoading) {
      let i = 0
      setThinkingMsg(THINKING_MESSAGES[0])
      thinkingInterval.current = setInterval(() => {
        i = (i + 1) % THINKING_MESSAGES.length
        setThinkingMsg(THINKING_MESSAGES[i])
      }, 1500)
    } else {
      if (thinkingInterval.current) clearInterval(thinkingInterval.current)
      setThinkingMsg('')
    }
    return () => {
      if (thinkingInterval.current) clearInterval(thinkingInterval.current)
    }
  }, [isLoading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text }
    const history = messages.slice(1)

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }])

    try {
      const response = await fetch('/api/v1/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: text,
          history: history.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) throw new Error('Error en la respuesta del agente')
      if (!response.body) throw new Error('No hay stream disponible')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
            isStreaming: true,
          }
          return updated
        })
      }

      // Marcamos el mensaje como completado
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        }
        return updated
      })

    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '❌ Error al conectar con el agente. Inténtalo de nuevo.',
          isStreaming: false,
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '650px',
      background: '#111',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid #222',
    }}>

      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>DJ Agent</div>
            <div style={{ fontSize: 12, color: isLoading ? '#f59e0b' : '#1DB954' }}>
              {isLoading ? thinkingMsg : '● En línea'}
            </div>
          </div>
        </div>
        {/* Botón limpiar chat */}
        <button
          onClick={() => setMessages([{
            role: 'assistant',
            content: '¡Hola! Soy tu DJ personal 🎵 ¿En qué te ayudo?'
          }])}
          style={{
            background: 'transparent',
            border: '1px solid #333',
            color: '#666',
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Limpiar
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#1DB954' : '#1e1e1e',
              color: 'white',
              fontSize: 14,
              lineHeight: 1.6,
            }}>
              {msg.role === 'assistant' ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {/* Markdown solo para mensajes completos */}
                  {msg.isStreaming ? (
                    <>
                      {msg.content}
                      <span style={{
                        display: 'inline-block',
                        width: 7,
                        height: 14,
                        background: '#1DB954',
                        marginLeft: 2,
                        animation: 'blink 1s infinite',
                        verticalAlign: 'text-bottom',
                      }} />
                    </>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ paddingLeft: 16, margin: '4px 0' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ paddingLeft: 16, margin: '4px 0' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ color: '#1DB954' }}>{children}</strong>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer"
                            style={{ color: '#1DB954' }}>{children}</a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 1 && (
        <div style={{ padding: '0 1.5rem 1rem', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SUGGESTED_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#aaa',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = '#1DB954')}
              onMouseOut={e => (e.currentTarget.style.borderColor = '#333')}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #222',
        display: 'flex',
        gap: 8,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Pregúntame algo sobre tu música..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 24,
            padding: '10px 16px',
            color: 'white',
            fontSize: 14,
            outline: 'none',
            opacity: isLoading ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          style={{
            background: isLoading || !input.trim() ? '#333' : '#1DB954',
            border: 'none',
            borderRadius: '50%',
            width: 42,
            height: 42,
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          ↑
        </button>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}