import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Send } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { useApiKey } from '../hooks/useApiKey'
import { buildDoctorContext } from '../../domain/services/bandyDoctorService'

const MAX_QUESTIONS = 5

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  'Vilken taktik passar mot nästa motståndare?',
  'Vilka spelare behöver vila?',
  'Vad är vår starka sida just nu?',
  'Hur förbättrar vi anfallet?',
  'Hur stärker vi försvaret?',
]

export function BandyDoktorScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const incrementDoctorQuestions = useGameStore(s => s.incrementDoctorQuestions)
  const { apiKey, saveApiKey } = useApiKey()

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const questionsUsed = game?.doctorQuestionsUsed ?? 0
  const questionsLeft = MAX_QUESTIONS - questionsUsed
  const canAsk = apiKey.length > 0 && questionsLeft > 0 && !isLoading

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function sendQuestion(question: string) {
    if (!canAsk || !game) return
    const trimmed = question.trim()
    if (!trimmed) return

    const context = buildDoctorContext(game)
    const userMessage: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputText('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          system: `Du är Bandydoktorn, en erfaren bandytränare och analytiker. Du ger kortfattad, praktisk rådgivning på svenska. Svara alltid på svenska, max 3-4 meningar. Var konkret och handlingsorienterad.\n\nSpelarens nuläge:\n${context}`,
          messages: newMessages,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error((errData as { error?: { message?: string } }).error?.message ?? `API-fel: ${response.status}`)
      }

      const data = await response.json() as { content: { type: string; text: string }[] }
      const assistantText = data.content.find(c => c.type === 'text')?.text ?? ''
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
      incrementDoctorQuestions()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Okänt fel'
      setError(`Doktorn är inte tillgänglig just nu. ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendQuestion(inputText)
  }

  function handleSaveApiKey() {
    const trimmed = apiKeyInput.trim()
    if (trimmed) {
      saveApiKey(trimmed)
      setApiKeyInput('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        gap: 12,
      }}>
        <button
          onClick={() => navigate('/game/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
          }}>
            BANDYDOKTORN
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            AI-rådgivare · {questionsLeft} {questionsLeft === 1 ? 'fråga' : 'frågor'} kvar
          </div>
        </div>
        <div style={{
          fontSize: 24,
          lineHeight: 1,
        }}>🩺</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* API key setup */}
        {!apiKey && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '16px',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 12, fontWeight: 600 }}>
              Aktivera Bandydoktorn
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Ange din Anthropic API-nyckel för att aktivera Bandydoktorn
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                style={{
                  flex: 1,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveApiKey() }}
              />
              <button
                onClick={handleSaveApiKey}
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  color: '#0D1B2A',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  letterSpacing: '0.3px',
                }}
              >
                SPARA
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Nyckeln sparas lokalt i din webbläsare
            </div>
          </div>
        )}

        {/* No questions left */}
        {apiKey && questionsLeft <= 0 && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}>
            Inga fler frågor denna omgång. Kom tillbaka nästa rond.
          </div>
        )}

        {/* Quick question buttons */}
        {apiKey && questionsLeft > 0 && messages.length === 0 && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.3px' }}>
              SNABBFRÅGOR
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendQuestion(q)}
                  disabled={!canAsk}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    cursor: canAsk ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    lineHeight: 1.4,
                    opacity: canAsk ? 1 : 0.5,
                    transition: 'background 0.15s',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {messages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? '#1a2e47' : '#2a2000',
                  border: msg.role === 'user' ? '1px solid #2a4060' : '1px solid #C9A84C44',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: msg.role === 'user' ? 'var(--text-primary)' : '#e8c96a',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius: '12px 12px 12px 2px',
                  background: '#2a2000',
                  border: '1px solid #C9A84C44',
                  fontSize: 13,
                  color: '#e8c96a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{ animation: 'pulse 1.2s infinite' }}>●</span>
                  <span style={{ animation: 'pulse 1.2s infinite 0.2s' }}>●</span>
                  <span style={{ animation: 'pulse 1.2s infinite 0.4s' }}>●</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#2a0a0a',
            border: '1px solid var(--danger)',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 12,
            color: 'var(--danger)',
          }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {apiKey && questionsLeft > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          paddingBottom: 'calc(12px + var(--safe-bottom))',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ställ en fråga till Bandydoktorn..."
              disabled={!canAsk}
              style={{
                flex: 1,
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                opacity: canAsk ? 1 : 0.5,
              }}
            />
            <button
              type="submit"
              disabled={!canAsk || !inputText.trim()}
              style={{
                background: canAsk && inputText.trim() ? 'var(--accent)' : 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                color: canAsk && inputText.trim() ? '#0D1B2A' : 'var(--text-muted)',
                cursor: canAsk && inputText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s',
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
