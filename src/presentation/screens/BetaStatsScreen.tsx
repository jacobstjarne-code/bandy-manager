import { useEffect, useRef, useState } from 'react'
import { attentionApiUrl } from '../../infrastructure/attention/attentionApiBase'
import '../styles/beta-access.css'

type BetaSummary = {
  unit: string
  retentionDays: number
  active7: number
  active30: number
  returnedOnAnotherDay7: number
  returnedOnAnotherDay30: number
  funnel90: Record<string, number>
  session30: { starts: number; ends: number; medianCompletedMinutes: number | null }
  features90: Record<string, number>
  issues30: { renderErrors: number; saveFailures: number }
  invites: { issued: number; redeemed: number; revoked: number; startedCareer: number; playedFirstMatch: number; queued: number }
}
type Invite = { id: string; createdAt: string; expiresAt: string; revokedAt: string | null; redeemedAt: string | null }
type WaitlistEntry = { email: string; createdAt: string }

const funnelLabels: Record<string, string> = {
  installed: 'Installationer', gameCreated: 'Startat karriär',
  onboardingDone: 'Avslutat introduktionen', firstMatch: 'Spelat första matchen',
  firstSeasonFiveMatches: 'Fem seriematcher', firstSeasonHalfway: 'Halva serien',
  seasonOneDone: 'Avslutat säsong 1', seasonThreeDone: 'Avslutat säsong 3',
}
const featureLabels: Record<string, string> = {
  training: 'Träning', tactics: 'Taktik', scouting: 'Scouting',
  transfers: 'Värvning', community: 'Orten',
}

export function BetaStatsScreen() {
  const [secret, setSecret] = useState('')
  const [summary, setSummary] = useState<BetaSummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [invites, setInvites] = useState<Invite[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [newCode, setNewCode] = useState('')
  const [newCodeRecipient, setNewCodeRecipient] = useState('')
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const generation = useRef(0)
  const createInFlight = useRef(false)
  useEffect(() => () => { generation.current += 1 }, [])

  function lock() {
    generation.current += 1
    createInFlight.current = false
    setCreating(false)
    setLoading(false)
    setSummary(null)
    setSecret('')
    setNewCode('')
    setNewCodeRecipient('')
    setInvites([])
    setWaitlist([])
    setCopied(false)
    setError('')
  }

  function adminHeaders(): HeadersInit { return { Authorization: `Bearer ${secret}` } }

  async function loadInvites(epoch: number) {
    if (epoch !== generation.current) return
    const response = await fetch(attentionApiUrl('/api/admin/beta-invites'), {
      headers: adminHeaders(), cache: 'no-store',
    })
    if (!response.ok) throw new Error('Inbjudningarna kunde inte hämtas.')
    const result = await response.json() as { invites: Invite[] }
    if (epoch === generation.current) setInvites(result.invites)
  }

  async function loadWaitlist(epoch: number) {
    if (epoch !== generation.current) return
    const response = await fetch(attentionApiUrl('/api/admin/beta-waitlist'), {
      headers: adminHeaders(), cache: 'no-store',
    })
    if (!response.ok) throw new Error('Väntelistan kunde inte hämtas.')
    const result = await response.json() as { waitlist: WaitlistEntry[] }
    if (epoch === generation.current) setWaitlist(result.waitlist)
  }

  async function loadStats(preserveSummary = false, epoch = generation.current) {
    if (epoch !== generation.current) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(attentionApiUrl('/api/admin/beta-stats'), {
        headers: { Authorization: `Bearer ${secret}` },
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(response.status === 401 ? 'Fel administratörsnyckel.' : 'Statistiken kunde inte hämtas.')
      const result = await response.json() as BetaSummary
      if (epoch !== generation.current) return
      setSummary(result)
      await loadInvites(epoch)
      await loadWaitlist(epoch)
    } catch (cause) {
      if (epoch !== generation.current) return
      if (!preserveSummary) setSummary(null)
      setError(cause instanceof Error ? cause.message : 'Statistiken kunde inte hämtas.')
    } finally {
      if (epoch === generation.current) setLoading(false)
    }
  }

  async function createInvite(waitlistEmail?: string) {
    if (createInFlight.current || newCode) return
    createInFlight.current = true
    const epoch = generation.current
    setCreating(true)
    setError('')
    try {
      const response = await fetch(attentionApiUrl('/api/admin/beta-invites'), {
        method: 'POST',
        headers: waitlistEmail
          ? { ...adminHeaders(), 'Content-Type': 'application/json' }
          : adminHeaders(),
        body: waitlistEmail ? JSON.stringify({ waitlistEmail }) : undefined,
      })
      if (!response.ok) throw new Error('Inbjudan kunde inte skapas.')
      const result = await response.json() as { code: string }
      if (epoch !== generation.current) return
      setNewCode(result.code)
      setNewCodeRecipient(waitlistEmail ?? '')
      setCopied(false)
      await loadStats(true, epoch)
    } catch (cause) {
      if (epoch === generation.current) setError(cause instanceof Error ? cause.message : 'Något gick fel.')
    } finally {
      if (epoch === generation.current) {
        createInFlight.current = false
        setCreating(false)
      }
    }
  }

  async function revokeInvite(id: string) {
    const epoch = generation.current
    if (!window.confirm('Återkalla inbjudan? Koden slutar fungera vid nästa kontroll.')) return
    setError('')
    try {
      const response = await fetch(attentionApiUrl(`/api/admin/beta-invites/${id}`), {
        method: 'DELETE', headers: adminHeaders(),
      })
      if (!response.ok) throw new Error('Inbjudan kunde inte återkallas.')
      await loadStats(true, epoch)
    } catch (cause) {
      if (epoch === generation.current) setError(cause instanceof Error ? cause.message : 'Något gick fel.')
    }
  }

  async function copyCode() {
    const epoch = generation.current
    try {
      await navigator.clipboard.writeText(newCode)
      if (epoch === generation.current) setCopied(true)
    } catch {
      if (epoch === generation.current) setError('Kopiering misslyckades. Markera och kopiera koden manuellt.')
    }
  }

  const statRow = (label: string, value: number | string) =>
    <div className="beta-access__stat-row" key={label}><span>{label}</span><strong>{value}</strong></div>

  return <main className="beta-access beta-access--admin">
    <div className="beta-access__admin-inner">
      <header className="beta-access__admin-header">
        <div className="beta-access__admin-topline">
          <span>BANDY MANAGER</span>
          <span>INTERN VY</span>
        </div>
        <p className="beta-access__eyebrow">BETATEST · ÖVERSIKT</p>
        <h1>Betatestet i siffror.</h1>
        <p>Måtten avser installationer, inte personer. Spelmåtten omfattar alla som tillåter användningsstatistik, även spelare utan betainbjudan. Inbjudna redovisas separat längre ner.</p>
      </header>

      {!summary && <section className="beta-access__panel beta-access__login">
        <h2>Öppna översikten</h2>
        <label className="beta-access__label" htmlFor="beta-admin-key">ADMINISTRATÖRSNYCKEL</label>
        <input className="beta-access__input" id="beta-admin-key" type="password" autoComplete="off"
          value={secret} onChange={event => setSecret(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && secret && !loading) void loadStats() }} />
        <button className="btn btn-primary beta-access__primary" type="button"
          onClick={() => void loadStats()} disabled={!secret || loading}>
          {loading ? 'HÄMTAR…' : 'VISA STATISTIK →'}
        </button>
        {/* adherence-semantic-key: authentication/read failure requiring admin action */}
        {error && <p className="beta-access__message" role="alert">{error}</p>}
      </section>}

      {summary && <>
        <section className="beta-access__overview" aria-label="Viktigaste måtten">
          <div className="beta-access__metric beta-access__metric--lead">
            <span>AKTIVA · 7 DAGAR</span><strong>{summary.active7}</strong><small>installationer</small>
          </div>
          <div className="beta-access__metric">
            <span>ÅTERKOMMIT · 7 DAGAR</span><strong>{summary.returnedOnAnotherDay7}</strong><small>en annan dag</small>
          </div>
          <div className="beta-access__metric">
            <span>FÖRSTA MATCHEN · 90 DAGAR</span><strong>{summary.funnel90.firstMatch ?? 0}</strong><small>installationer</small>
          </div>
          <div className="beta-access__metric">
            <span>SPARFEL · 30 DAGAR</span><strong>{summary.issues30.saveFailures}</strong><small>rapporterade fel</small>
          </div>
        </section>

        <section className="beta-access__panel">
          <div className="beta-access__section-head"><span>01 / SPEL</span><h2>Vägen genom spelet</h2><small>Senaste 90 dagarna</small></div>
          <div className="beta-access__rows">
            {Object.entries(summary.funnel90).map(([key, value]) => statRow(funnelLabels[key] ?? key, value))}
          </div>
          <p className="beta-access__note">Unika installationer per steg. En installation kan ha flera karriärer, så detta är inte en strikt karriärtratt.</p>
        </section>

        <section className="beta-access__panel">
          <div className="beta-access__section-head"><span>02 / ÅTERKOMST</span><h2>Aktivitet</h2><small>Senaste 7 och 30 dagarna</small></div>
          <div className="beta-access__rows">
            {statRow('Aktiva · 7 dagar', summary.active7)}
            {statRow('Aktiva · 30 dagar', summary.active30)}
            {statRow('Återkommit en annan dag · 7 dagar', summary.returnedOnAnotherDay7)}
            {statRow('Återkommit en annan dag · 30 dagar', summary.returnedOnAnotherDay30)}
          </div>
        </section>

        <section className="beta-access__panel">
          <div className="beta-access__section-head"><span>03 / FUNKTIONER</span><h2>Vad spelarna hittar</h2><small>Senaste 90 dagarna</small></div>
          <div className="beta-access__rows">
            {Object.entries(summary.features90).map(([key, value]) => statRow(featureLabels[key] ?? key, value))}
          </div>
          <p className="beta-access__note">Visar första öppning efter att mätningen infördes, inte hur mycket funktionen används.</p>
        </section>

        <section className="beta-access__panel">
          <div className="beta-access__section-head"><span>04 / TEKNIK</span><h2>Pass och fel</h2><small>Senaste 30 dagarna</small></div>
          <div className="beta-access__rows">
            {statRow('Startade pass', summary.session30.starts)}
            {statRow('Rapporterade avslut', summary.session30.ends)}
            {statRow('Median för avslutade pass', summary.session30.medianCompletedMinutes === null ? '–' : summary.session30.medianCompletedMinutes + ' min')}
            {statRow('Renderingsfel', summary.issues30.renderErrors)}
            {statRow('Sparfel', summary.issues30.saveFailures)}
          </div>
          <p className="beta-access__note">Passlängden är osäker när webbläsaren inte hinner rapportera avslutet.</p>
        </section>

        <section className="beta-access__panel">
          <div className="beta-access__section-head"><span>05 / TILLTRÄDE</span><h2>Inbjudningar</h2></div>
          <div className="beta-access__invite-counts">
            <div><strong>{summary.invites.issued}</strong><span>Utfärdade</span></div>
            <div><strong>{summary.invites.redeemed}</strong><span>Använda</span></div>
            <div><strong>{summary.invites.revoked}</strong><span>Återkallade</span></div>
            <div><strong>{summary.invites.queued}</strong><span>I kö</span></div>
          </div>
          <div className="beta-access__rows">
            {statRow('Inbjudna som startat karriär', summary.invites.startedCareer)}
            {statRow('Inbjudna som spelat första matchen', summary.invites.playedFirstMatch)}
          </div>
          <p className="beta-access__note">De två spelmåtten inkluderar bara installationer som tillåter användningsstatistik.</p>
          <button className="btn btn-primary beta-access__primary beta-access__create" type="button"
            disabled={creating || Boolean(newCode)} onClick={() => void createInvite()}>{creating ? 'SKAPAR…' : 'SKAPA INBJUDAN →'}</button>
          {newCode && <div className="beta-access__code-panel" role="status">
            <strong>Ny inbjudningskod</strong>
            <p>{newCodeRecipient
              ? <>Koden visas bara nu. Skicka den till <strong>{newCodeRecipient}</strong>.</>
              : 'Koden visas bara nu. Skicka den direkt till den du vill bjuda in.'}</p>
            <code>{newCode}</code>
            <div className="beta-access__code-actions">
              <button className="btn btn-outline" type="button" onClick={() => void copyCode()}>{copied ? 'KOPIERAD ✓' : 'KOPIERA KOD'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => {
                setNewCode(''); setNewCodeRecipient(''); setCopied(false)
              }}>KLAR</button>
            </div>
          </div>}
          <details className="beta-access__invite-details" open={waitlist.length > 0}>
            <summary>VISA VÄNTELISTA <span>{waitlist.length}</span></summary>
            {waitlist.length === 0 && <p className="beta-access__note">Ingen står i kö.</p>}
            {waitlist.map(entry => <div className="beta-access__invite-item" key={entry.email}>
              <div><strong>{entry.email}</strong><span>{new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(entry.createdAt))}</span></div>
              <button className="beta-access__text-button" type="button"
                disabled={creating || Boolean(newCode)} onClick={() => void createInvite(entry.email)}>SKAPA KOD</button>
            </div>)}
          </details>
          <details className="beta-access__invite-details">
            <summary>VISA INBJUDNINGAR <span>{invites.length}</span></summary>
            {invites.length === 0 && <p className="beta-access__note">Inga inbjudningar ännu.</p>}
            {invites.map(invite => {
              const status = invite.revokedAt ? 'Återkallad' : invite.redeemedAt ? 'Använd' : Date.parse(invite.expiresAt) <= Date.now() ? 'Utgången' : 'Oanvänd'
              return <div className="beta-access__invite-item" key={invite.id}>
                <div><strong>Inbjudan · {invite.id.slice(-6)}</strong><span>{new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(invite.createdAt))} · {status}</span></div>
                {!invite.revokedAt && <button className="beta-access__text-button" type="button" onClick={() => void revokeInvite(invite.id)}>ÅTERKALLA</button>}
              </div>
            })}
          </details>
          {/* adherence-semantic-key: invite creation/revocation failed */}
          {error && <p className="beta-access__message" role="alert">{error}</p>}
        </section>
        <button className="beta-access__lock" type="button"
          onClick={lock}>LÅS VYN</button>
      </>}
      <p className="beta-access__admin-footer">Råa händelser gallras efter {summary?.retentionDays ?? 90} dagar. Spelarens statistikval respekteras.</p>
    </div>
  </main>
}
