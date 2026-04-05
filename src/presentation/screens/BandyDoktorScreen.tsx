import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Send } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
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

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const questionsUsed = game?.doctorQuestionsUsed ?? 0
  const questionsLeft = MAX_QUESTIONS - questionsUsed
  const canAsk = questionsLeft > 0 && !isLoading

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function sendQuestion(question: string) {
    if (!canAsk || !game) return
    const trimmed = question.trim()
    if (!trimmed) return

    const context = `Du är Bandydoktorn, en erfaren bandytränare och analytiker. Du ger kortfattad, praktisk rådgivning på svenska. Svara alltid på svenska, max 3-4 meningar. Var konkret och handlingsorienterad.\n\nSpelarens nuläge:\n${buildDoctorContext(game)}`
    const userMessage: Message = { role: 'user', content: trimmed }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputText('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(errData.error ?? `API-fel: ${response.status}`)
      }

      const data = await response.json() as { content: { type: string; text: string }[] }
      const assistantText = data.content.find(c => c.type === 'text')?.text ?? ''
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
      incrementDoctorQuestions()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Okänt fel'
      if (msg.includes('API key') || msg.includes('not configured') || msg.includes('500') || msg.includes('API-fel: 500')) {
        setError('Bandydoktorn kräver en Anthropic API-nyckel. Konfigurera ANTHROPIC_API_KEY i Render-miljön.')
      } else {
        setError(`Bandydoktorn kunde inte svara just nu. (${msg})`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendQuestion(inputText)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--bg)' }}>
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
        <div style={{ fontSize: 24, lineHeight: 1 }}>🩺</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* No questions left */}
        {questionsLeft <= 0 && (
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

        {/* Intro — first time */}
        {questionsLeft > 0 && messages.length === 0 && (
          <div className="card-round" style={{ padding: '16px', textAlign: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 24, marginBottom: 8 }}>🩺</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              Bandydoktorn
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4 }}>
              Din personliga rådgivare. Ställ frågor om truppen, taktik, transfermarknaden, eller spelets mekanik.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {questionsLeft} frågor kvar denna omgång.
            </p>
          </div>
        )}

        {/* Quick question buttons */}
        {questionsLeft > 0 && messages.length === 0 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12, padding: '0 2px' }}>
              Bandydoktorn är din AI-rådgivare. Fråga om taktik, spelarval och matchförberedelser.
              {' '}{questionsLeft} {questionsLeft === 1 ? 'fråga' : 'frågor'} kvar denna omgång.
            </p>
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

        {/* Guide / FAQ */}
        {messages.length === 0 && questionsLeft > 0 && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
              ❓ GUIDE
            </p>
            {[
              { q: 'Scouting', a: 'Tre system, en budget (10/säsong). Talangspaning hittar nya spelare. Utvärdering ger attribut. Motståndaranalys inför match.' },
              { q: 'Väder', a: 'Snö straffar bollkontroll. Dimma försvårar bredd. Töväder ökar skaderisk. Kyla ger hård, snabb is.' },
              { q: 'Dubbelliv', a: 'De flesta spelare jobbar. Flexibilitet påverkar träning. Heltidsproffs kostar mer men tränar bättre.' },
              { q: 'Transfers', a: 'Marknaden visar tillgängliga spelare. Scouta först för att hitta fynd. Bud baseras på marknadsvärde.' },
              { q: 'Styrelsen', a: 'Styrelsen sätter säsongsmål. Resultat under förväntan sänker tålamodet. SM-guld ger legendstatus.' },
              { q: 'Träning', a: 'Välj typ och intensitet. Hård träning ger snabbare utveckling men högre skaderisk.' },
            ].map((item, i) => (
              <details key={i} style={{ marginBottom: 4 }}>
                <summary style={{ fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer', padding: '6px 0', fontWeight: 600 }}>
                  {item.q}
                </summary>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, padding: '4px 0 8px 12px' }}>
                  {item.a}
                </p>
              </details>
            ))}
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
                  background: msg.role === 'user' ? 'var(--bg-dark-elevated)' : 'rgba(196,122,58,0.08)',
                  border: msg.role === 'user' ? '1px solid rgba(196,186,168,0.12)' : '1px solid rgba(196,122,58,0.25)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: msg.role === 'user' ? 'var(--text-light)' : 'var(--text-light-secondary)',
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
                  background: 'rgba(196,122,58,0.08)',
                  border: '1px solid rgba(196,122,58,0.25)',
                  fontSize: 13,
                  color: 'var(--text-light-secondary)',
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
            background: 'var(--bg-dark-surface)',
            border: '1px solid var(--danger)',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 12,
            color: 'var(--danger)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Något gick fel</div>
            <div>{error}</div>
            <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>Kontrollera din internetanslutning och försök igen.</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {questionsLeft > 0 && (
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
                background: 'var(--bg)',
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
                background: canAsk && inputText.trim() ? 'var(--accent)' : 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                color: canAsk && inputText.trim() ? 'var(--bg-dark)' : 'var(--text-muted)',
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
