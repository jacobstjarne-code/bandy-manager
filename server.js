import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cors from 'cors'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173'],
}))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'dist')))

const doctorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'För många frågor. Vänta en stund.' },
})

app.post('/api/doctor', doctorLimiter, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const { messages, context } = req.body
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request' })
  }
  if (messages.length > 10) {
    return res.status(400).json({ error: 'Too many messages' })
  }

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
        system: context,
        messages: messages.slice(-6),
      }),
    })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Proxy error' })
  }
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server on port ${PORT}`))
