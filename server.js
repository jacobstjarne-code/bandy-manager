import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cors from 'cors'
import { createAttentionRouter } from './server/attention/routes.js'
import { createAttentionStore } from './server/attention/runtime.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// ── Säkerhetsheaders ───────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))

// ── CORS ────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : (() => {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[CORS] ALLOWED_ORIGINS inte satt i produktion — alla origins blockeras')
        return []
      }
      return ['http://localhost:5173', 'http://localhost:3000']
    })()

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

// Attention Engine/Web Push. Routern ligger före SPA-fallbacken; servern
// behöver en hållbar store-adapter och en extern scheduler i produktion.
const attentionStore = await createAttentionStore(process.env)
const attention = createAttentionRouter({ store: attentionStore })
app.use('/api', attention.router)

// ── Health check ────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '0.3.0' })
})

// ── SPA fallback ────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => console.log(`Bandy Manager server on port ${PORT}`))

async function shutdown(signal) {
  console.log(`[server] ${signal} — stanger`)
  server.close(async () => {
    await attentionStore.close?.()
    process.exit(0)
  })
}

process.once('SIGTERM', () => { void shutdown('SIGTERM') })
process.once('SIGINT', () => { void shutdown('SIGINT') })
