/**
 * Panel de chat con el agente DJ.
 * Implementa streaming: las respuestas aparecen token a token
 * usando ReadableStream de la Fetch API.
 */
import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS = [
  '¿Cuáles son mis artistas favoritos?',
  '¿Qué canciones he escuchado más?',
  'Crea una playlist con mis tops del último mes',
  '¿Qué género musical domina mi perfil?',
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
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text }
    const history = messages.slice(1) // Excluimos el mensaje de bienvenida del historial

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Añadimos el mensaje del asistente vacío que iremos rellenando
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

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

      // Leemos el stream token a token
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // Actualizamos el último mensaje (el del asistente) añadiendo el chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '❌ Error al conectar con el agente. Inténtalo de nuevo.',
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
      height: '600px',
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
        gap: 10,
      }}>
        <span style={{ fontSize: 24 }}>🤖</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>DJ Agent</div>
          <div style={{ fontSize: 12, color: '#1DB954' }}>
            {isLoading ? 'Pensando...' : 'En línea'}
          </div>
        </div>
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
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#1DB954' : '#1e1e1e',
              color: 'white',
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
              {/* Cursor parpadeante mientras el agente escribe */}
              {isLoading && i === messages.length - 1 && msg.role === 'assistant' && (
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 14,
                  background: '#1DB954',
                  marginLeft: 2,
                  animation: 'blink 1s infinite',
                  verticalAlign: 'text-bottom',
                }} />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts — solo al inicio */}
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
              }}
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
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          style={{
            background: isLoading || !input.trim() ? '#333' : '#1DB954',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ↑
        </button>
      </div>

      {/* CSS para el cursor parpadeante */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}