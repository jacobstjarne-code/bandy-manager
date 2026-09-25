import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { checkBetaAccess, hasCachedBetaAccess, redeemBetaInvite } from '../../infrastructure/attention/attentionClient'
import '../styles/beta-access.css'

const SLOW_CHECK_MS = 4_000
// Render Free vaknar på upp till en minut; efter det är det ett riktigt fel.
const CHECK_TIMEOUT_MS = 75_000

/**
 * Betafynd 3: Safari-fliken och hemskärmsappen har skilda localStorage på
 * iOS, alltså skilda installationer. En kod som löses in i fliken är sedan
 * förbrukad när spelaren öppnar appen från hemskärmen.
 */
function isIosBrowserTab(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios && !standalone
}

/** Off until the beta launch explicitly enables VITE_BETA_INVITES_ENABLED. */
export function BetaInviteGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const enabled = import.meta.env.VITE_BETA_INVITES_ENABLED === 'true'
  // Betafynd 2: en installation som redan löst in sin kod släpps in direkt,
  // även offline eller medan Render-tjänsten vaknar. Kontrollen körs ändå i
  // bakgrunden och stänger bara vid ett uttryckligt nej från servern.
  const [granted, setGranted] = useState(() => enabled && hasCachedBetaAccess())
  const [checking, setChecking] = useState(true)
  const [slow, setSlow] = useState(false)
  const [retry, setRetry] = useState(0)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [connectionError, setConnectionError] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const iosBrowserTab = isIosBrowserTab()

  useEffect(() => {
    if (!enabled || location.pathname === '/admin/beta') return
    let mounted = true
    setChecking(true)
    setSlow(false)
    const slowTimer = setTimeout(() => { if (mounted) setSlow(true) }, SLOW_CHECK_MS)
    checkBetaAccess(CHECK_TIMEOUT_MS).then(access => {
      if (mounted) { setGranted(access); setConnectionError(false); setMessage(''); setChecking(false) }
    }).catch(() => {
      if (mounted) { setConnectionError(true); setMessage('Kunde inte nå betatjänsten. Försök igen om en stund.'); setChecking(false) }
    }).finally(() => clearTimeout(slowTimer))
    return () => { mounted = false; clearTimeout(slowTimer) }
  }, [enabled, location.pathname === '/admin/beta', retry])

  if (!enabled || location.pathname === '/admin/beta') return <>{children}</>
  if (granted) return <>{children}</>

  async function redeem() {
    if (!code.trim() || redeeming) return
    setMessage('')
    setRedeeming(true)
    try {
      await redeemBetaInvite(code)
      setCode('')
      setGranted(true)
    } catch {
      setMessage('Koden gick inte att använda. Kolla tecknen, eller be om en ny om du redan använt den på en annan telefon.')
    } finally {
      setRedeeming(false)
    }
  }

  return <main className="beta-access beta-access--gate">
    <img className="beta-access__masthead" src="/bandymanager-logo.png" alt="Bandy Manager" />
    <section className="beta-access__gate-card" aria-labelledby="beta-gate-title">
      <p className="beta-access__eyebrow">BETATEST · INBJUDAN</p>
      <h1 id="beta-gate-title">Betatestet.</h1>
      <p className="beta-access__lead">Betan är stängd. Skriv in din kod så öppnar vi.</p>
      {checking ? <p className="beta-access__checking" role="status">
          {slow ? 'Servern vaknar. Första gången kan det ta upp till en minut.' : 'Kontrollerar tillträde…'}
        </p> :
        connectionError ? <>
          <p className="beta-access__message" role="alert">{message}</p>
          <button className="btn btn-outline beta-access__primary" type="button"
            onClick={() => { setMessage(''); setRetry(value => value + 1) }}>FÖRSÖK IGEN</button>
        </> : <form onSubmit={event => { event.preventDefault(); void redeem() }}>
          <label className="beta-access__label" htmlFor="beta-code">INBJUDNINGSKOD</label>
          <input className="beta-access__input" id="beta-code" value={code} onChange={event => setCode(event.target.value)}
            autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            aria-describedby={message ? 'beta-gate-message' : undefined} />
          {iosBrowserTab && <p className="beta-access__hint" role="note">
            Spelet är öppet i Safari. Lägg det på hemskärmen och skriv in koden där. Koden fungerar bara på ett ställe.
          </p>}
          <p className="beta-access__hint">Har du ingen kod? Kön finns på bandy-manager.se.</p>
          <button className="btn btn-primary beta-access__primary" type="submit" disabled={!code.trim() || redeeming}>
            {redeeming ? 'KONTROLLERAR…' : 'GÅ VIDARE →'}
          </button>
          {message && <p className="beta-access__message" id="beta-gate-message" role="alert">{message}</p>}
        </form>}
    </section>
    <img className="beta-access__footer" src="/buryfen-logo.png" alt="Bury Fen" />
  </main>
}
