import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

/**
 * GAP-2: lättviktig testar-feedback. Bygger på build-hash-overlayn — den visade
 * hashen är nu tappbar och öppnar en rapport som fångar build-hash + save-id +
 * skärm + säsong/omgång + fritext. Ingen backend → export via urklipp + mailto
 * (testaren klistrar/skickar). Gör speltestdatan precis i stället för "det kändes
 * konstigt nån gång". RC-testchrome, ej spelyta.
 *
 * K-1 (dock-audit 2026-07-02, mobil omverifierad 2026-09-03): dold genom
 * HELA matchflödet. Den fixerade raden landade inte bara ovanpå live-docken
 * utan också mitt över SPELA MATCHEN och Granskas slut-CTA på 390 px bredd.
 * Rapportering finns kvar på övriga skärmar.
 */

declare const __GIT_HASH__: string

const REPORT_EMAIL = 'jacob.stjarne@gmail.com'

function buildHash(): string {
  return typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev'
}

export function isFeedbackHiddenOnRoute(pathname: string): boolean {
  return pathname === '/'
    || pathname === '/saves'
    || pathname === '/new-game'
    || pathname === '/club-selection'
    || pathname === '/intro'
    || pathname === '/tilltrade'
    || pathname.startsWith('/game/match')
    || pathname.startsWith('/game/review')
    // Dev-galleriet ska vara en deterministisk bild av produktionens ytor.
    // En fixerad rapportknapp vars text innehåller den aktuella commit-hashen
    // gör annars varje visuell baslinje stale vid varje deploy.
    || pathname.startsWith('/dev')
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const game = useGameStore(s => s.game)
  const location = useLocation()
  const hiddenOnMatchFlow = isFeedbackHiddenOnRoute(location.pathname)

  function buildReport(): string {
    const route = location.pathname
    return [
      `build: ${buildHash()}`,
      `save:  ${game?.id ?? '—'}`,
      `skärm: ${route}`,
      `läge:  säsong ${game?.currentSeason ?? '—'}, omg ${game?.currentMatchday ?? '—'}`,
      '—',
      text.trim() || '(ingen beskrivning)',
    ].join('\n')
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(buildReport())
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* urklipp blockerat — testaren får använda Mejla */ }
  }

  function mailReport() {
    const subject = encodeURIComponent(`Bandy Manager — rapport (${buildHash()})`)
    const body = encodeURIComponent(buildReport())
    window.location.href = `mailto:${REPORT_EMAIL}?subject=${subject}&body=${body}`
  }

  if (hiddenOnMatchFlow) return null

  return (
    <>
      {/* Tappbar hash-rad (ersätter den statiska overlayn) */}
      <button
        data-feedback-button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 9999,
          margin: '0 auto', display: 'block', width: 'fit-content',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'rgba(255,255,255,0.55)',
          fontFamily: 'monospace', letterSpacing: '1px',
        }}
      >
        {buildHash()} · rapportera
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'color-mix(in srgb, var(--bg-dark) 88%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 360,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Rapportera</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1.5 }}>
              {buildHash()} · säsong {game?.currentSeason ?? '—'}, omg {game?.currentMatchday ?? '—'}
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Vad hände? Var fastnade du?"
              rows={4}
              autoFocus
              style={{
                width: '100%', resize: 'vertical', boxSizing: 'border-box',
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '8px 10px',
                fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyReport} className="btn btn-primary" style={{ flex: 1, fontSize: 13 }}>
                {copied ? '✓ Kopierat' : 'Kopiera'}
              </button>
              <button onClick={mailReport} className="btn btn-outline" style={{ flex: 1, fontSize: 13 }}>
                Mejla
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}
            >
              Stäng
            </button>
          </div>
        </div>
      )}
    </>
  )
}
