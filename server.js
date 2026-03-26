import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cors from 'cors'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// ── Säkerhetsheaders ───────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
    },
  },
}))

// ── CORS ────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000']

app.use(cors({ origin: allowedOrigins }))

app.use(express.json({ limit: '50kb' }))
app.use(express.static(path.join(__dirname, 'dist')))

// ── Global rate limit ───────────────────────────
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(globalLimiter)

// ── Bandydoktorn rate limit ─────────────────────
const doctorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'För många frågor. Vänta en stund.' },
})

// ── Bandydoktorn — säker proxy ──────────────────
app.post('/api/doctor', doctorLimiter, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const { messages, context } = req.body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Ogiltigt meddelande-format' })
  }
  if (messages.length > 10) {
    return res.status(400).json({ error: 'För många meddelanden i konversationen' })
  }
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return res.status(400).json({ error: 'Meddelande saknar role eller content' })
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ error: 'Ogiltig role' })
    }
    if (typeof msg.content !== 'string' || msg.content.length > 2000) {
      return res.status(400).json({ error: 'Meddelande för långt (max 2000 tecken)' })
    }
  }
  if (context && typeof context !== 'string') {
    return res.status(400).json({ error: 'Ogiltigt kontext-format' })
  }
  if (context && context.length > 5000) {
    return res.status(400).json({ error: 'Kontext för lång' })
  }

  const systemPrompt = typeof context === 'string' && context.length > 0
    ? context
    : 'Du är Bandydoktorn. Svara kort och konkret på svenska.'

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.slice(-6),
      }),
    })
    const data = await response.json()

    if (!response.ok) {
      console.error('Anthropic API error:', data)
      return res.status(response.status).json({ error: 'Bandydoktorn kunde inte svara just nu.' })
    }

    res.json(data)
  } catch (err) {
    console.error('Doctor proxy error:', err)
    res.status(500).json({ error: 'Bandydoktorn är inte tillgänglig.' })
  }
})

// ── Health check ────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '0.3.0' })
})

// ── SPA fallback ────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Bandy Manager server on port ${PORT}`))
