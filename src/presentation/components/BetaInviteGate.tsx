import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { checkBetaAccess, redeemBetaInvite } from '../../infrastructure/attention/attentionClient'
import '../styles/beta-access.css'

/** Off until the beta launch explicitly enables VITE_BETA_INVITES_ENABLED. */
export function BetaInviteGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const enabled = import.meta.env.VITE_BETA_INVITES_ENABLED === 'true'
  const [granted, setGranted] = useState(false)
  const [checking, setChecking] = useState(true)
  const [retry, setRetry] = useState(0)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [connectionError, setConnectionError] = useState(false)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    if (!enabled || location.pathname === '/admin/beta') return
    let mounted = true
    setChecking(true)
    checkBetaAccess().then(access => {
      if (mounted) { setGranted(access); setConnectionError(false); setMessage(''); setChecking(false) }
    }).catch(() => {
      if (mounted) { setConnectionError(true); setMessage('Kunde inte nå betatjänsten. Försök igen.'); setChecking(false) }
    })
    return () => { mounted = false }
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
      {checking ? <p className="beta-access__checking" role="status">Kontrollerar tillträde…</p> :
        connectionError ? <>
          <p className="beta-access__message" role="alert">{message}</p>
          <button className="btn btn-outline beta-access__primary" type="button"
            onClick={() => { setMessage(''); setRetry(value => value + 1) }}>FÖRSÖK IGEN</button>
        </> : <form onSubmit={event => { event.preventDefault(); void redeem() }}>
          <label className="beta-access__label" htmlFor="beta-code">INBJUDNINGSKOD</label>
          <input className="beta-access__input" id="beta-code" value={code} onChange={event => setCode(event.target.value)}
            autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            aria-describedby={message ? 'beta-gate-message' : undefined} />
          <p className="beta-access__hint">Har du ingen kod? Kön finns på bandymanager.se.</p>
          <button className="btn btn-primary beta-access__primary" type="submit" disabled={!code.trim() || redeeming}>
            {redeeming ? 'KONTROLLERAR…' : 'GÅ VIDARE →'}
          </button>
          {message && <p className="beta-access__message" id="beta-gate-message" role="alert">{message}</p>}
        </form>}
    </section>
    <img className="beta-access__footer" src="/buryfen-logo.png" alt="Bury Fen" />
  </main>
}
