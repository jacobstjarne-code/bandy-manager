import { useState } from 'react'
import type { Club } from '../../../domain/entities/Club'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { SectionCard } from '../SectionCard'
import { formatCurrency, formatFinance } from '../../utils/formatters'

interface EkonomiTabProps {
  club: Club
  game: SaveGame
  seekSponsor: () => { success: boolean; sponsor?: { name: string; weeklyIncome: number }; error?: string }
  activateCommunity: (key: string, level: string) => { success: boolean; error?: string }
  setTransferBudget: (amount: number) => void
  buyScoutRounds: () => void
}

export function EkonomiTab({ club, game, seekSponsor, activateCommunity, setTransferBudget, buyScoutRounds }: EkonomiTabProps) {
  const [sponsorFeedback, setSponsorFeedback] = useState<string | null>(null)
  const [communityMsg, setCommunityMsg] = useState<{ key: string; text: string; ok: boolean } | null>(null)
  const [pendingTransferBudget, setPendingTransferBudget] = useState<number | null>(null)
  const [savedFeedback, setSavedFeedback] = useState(false)

  function handleActivate(key: string, level: string) {
    const result = activateCommunity(key, level)
    setCommunityMsg({ key, text: result.error ?? 'Aktiverat!', ok: result.success })
    setTimeout(() => setCommunityMsg(null), 3000)
  }

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const actualMonthlyWages = managedPlayers.reduce((sum, p) => sum + p.salary, 0)
  const activeSponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
  const maxSponsors = Math.min(6, 2 + Math.floor(club.reputation / 20))
  const weeklySponsors = activeSponsors.reduce((sum, s) => sum + s.weeklyIncome, 0)
  const ca = game.communityActivities
  const kioskEst = ca?.kiosk === 'upgraded' ? 10000 : ca?.kiosk === 'basic' ? 5000 : 0
  const lotteryEst = ca?.lottery === 'intensive' ? 4000 : ca?.lottery === 'basic' ? 1750 : 0
  const bandyplayEst = ca?.bandyplay ? 1500 : 0
  const functionariesEst = ca?.functionaries ? 4000 : 0
  const communityEst = kioskEst + lotteryEst + functionariesEst + bandyplayEst
  const weeklyBase = Math.round(club.reputation * 250)
  const weeklyIncome = weeklyBase + weeklySponsors + communityEst
  const weeklyWages = Math.round(actualMonthlyWages / 4)
  const netPerRound = weeklyIncome - weeklyWages
  const patron = game.patron?.isActive ? game.patron : null
  const kommunBidrag = game.localPolitician?.kommunBidrag ?? 0
  const wagePressure = actualMonthlyWages > club.wageBudget
  const slots = Array.from({ length: maxSponsors })

  const licenseReview = game.licenseReview
  const licenseIcon = licenseReview?.status === 'approved' ? '✅'
    : licenseReview?.status === 'warning' ? '⚠️'
    : licenseReview?.status === 'continued_review' ? '🔴'
    : licenseReview?.status === 'denied' ? '❌'
    : '✅'
  const licenseLabel = licenseReview?.status === 'approved' ? 'Godkänd'
    : licenseReview?.status === 'warning' ? 'Varning'
    : licenseReview?.status === 'continued_review' ? 'Fortsatt granskning'
    : licenseReview?.status === 'denied' ? 'Nekad'
    : 'Ej granskad'
  const licenseColor = licenseReview?.status === 'approved' ? 'var(--success)'
    : licenseReview?.status === 'warning' ? 'var(--warning)'
    : licenseReview?.status === 'continued_review' ? 'var(--danger)'
    : licenseReview?.status === 'denied' ? 'var(--danger)'
    : 'var(--text-muted)'
  const communityStanding = game.communityStanding ?? 50

  interface CommunityRow {
    icon: string; name: string; active: boolean; status: string
    income: string; value: number
    actionKey?: string; actionLevel?: string; actionCost?: number; actionLabel?: string
    upgradeKey?: string; upgradeLevel?: string; upgradeCost?: number; upgradeLabel?: string
    noAction?: boolean
  }
  const communityRows: CommunityRow[] = [
    {
      icon: '🌭', name: 'Bandykiosken',
      active: ca?.kiosk !== 'none' && !!ca?.kiosk,
      status: ca?.kiosk === 'upgraded' ? 'Uppgraderad' : ca?.kiosk === 'basic' ? 'Aktiv' : 'Ej startad',
      income: ca?.kiosk === 'upgraded' ? '~8 500 netto/match' : ca?.kiosk === 'basic' ? '~3 500 netto/match' : '—',
      value: kioskEst,
      ...(ca?.kiosk === 'none' || !ca?.kiosk
        ? { actionKey: 'kiosk', actionLevel: 'basic', actionCost: 3000, actionLabel: 'Starta kiosk — 3 tkr' }
        : ca?.kiosk === 'basic'
          ? { upgradeKey: 'kiosk', upgradeLevel: 'upgraded', upgradeCost: 8000, upgradeLabel: 'Uppgradera — 8 tkr' }
          : {}),
    },
    {
      icon: '🎫', name: 'Föreningslotteriet',
      active: ca?.lottery !== 'none' && !!ca?.lottery,
      status: ca?.lottery === 'intensive' ? 'Intensiv' : ca?.lottery === 'basic' ? 'Aktiv' : 'Ej startad',
      income: ca?.lottery === 'intensive' ? '~3 200 netto/omg' : ca?.lottery === 'basic' ? '~1 250 netto/omg' : '—',
      value: lotteryEst,
      ...(ca?.lottery === 'none' || !ca?.lottery
        ? { actionKey: 'lottery', actionLevel: 'basic', actionCost: 1000, actionLabel: 'Starta lotteri — 1 tkr' }
        : ca?.lottery === 'basic'
          ? { upgradeKey: 'lottery', upgradeLevel: 'intensive', upgradeCost: 5000, upgradeLabel: 'Intensifiera — 5 tkr' }
          : {}),
    },
    {
      icon: '📺', name: 'Streamingavtal',
      active: !!ca?.bandyplay,
      status: ca?.bandyplay ? 'Aktiv' : club.reputation < 40 ? 'Ingen intresserad ännu' : 'Möjligt',
      income: ca?.bandyplay ? '~1 500/match' : '—',
      value: bandyplayEst,
      ...(!ca?.bandyplay
        ? { actionKey: 'bandyplay', actionLevel: 'active', actionCost: 0, actionLabel: 'Teckna avtal — gratis' }
        : {}),
    },
    {
      icon: '🏋️', name: 'Funktionärer',
      active: !!ca?.functionaries,
      status: ca?.functionaries ? 'Aktiv' : 'Ej rekryterade',
      income: ca?.functionaries ? '~4 000 besparing/match' : '—',
      value: functionariesEst,
      ...(!ca?.functionaries
        ? { actionKey: 'functionaries', actionLevel: 'active', actionCost: 2000, actionLabel: 'Rekrytera — 2 tkr' }
        : {}),
    },
    {
      icon: '🎄', name: 'Julmarknad',
      active: !!ca?.julmarknad,
      status: ca?.julmarknad ? 'Genomförd ✓' : 'Väntar (omg 8–12)',
      income: ca?.julmarknad ? 'Klar' : '~8–18 tkr (engång)',
      value: 0,
      ...(!ca?.julmarknad
        ? { actionKey: 'julmarknad', actionLevel: 'active', actionCost: 2000, actionLabel: 'Anordna — 2 tkr' }
        : {}),
    },
    {
      icon: '🏫', name: 'Bandyskola',
      active: !!ca?.bandySchool,
      status: ca?.bandySchool ? 'Aktiv' : 'Ej startad',
      income: ca?.bandySchool ? '~1 000/omg + ungdom' : '—',
      value: ca?.bandySchool ? 1000 : 0,
      ...(!ca?.bandySchool
        ? { actionKey: 'bandySchool', actionLevel: 'active', actionCost: 5000, actionLabel: 'Starta bandyskola — 5 tkr' }
        : {}),
    },
    {
      icon: '📱', name: 'Sociala medier',
      active: !!ca?.socialMedia,
      status: ca?.socialMedia ? 'Aktiv' : 'Ej startad',
      income: ca?.socialMedia ? '+reputation' : '—',
      value: 0,
      ...(!ca?.socialMedia
        ? { actionKey: 'socialMedia', actionLevel: 'active', actionCost: 2000, actionLabel: 'Starta konto — 2 tkr' }
        : {}),
    },
    {
      icon: '🍺', name: 'VIP-tält',
      active: !!ca?.vipTent,
      status: ca?.vipTent ? 'Aktiv' : club.facilities > 60 ? 'Ej startad' : 'Kräver anläggning > 60',
      income: ca?.vipTent ? '~10 000/match' : '—',
      value: ca?.vipTent ? 10000 : 0,
      ...(!ca?.vipTent && club.facilities > 60
        ? { actionKey: 'vipTent', actionLevel: 'active', actionCost: 10000, actionLabel: 'Sätt upp VIP-tält — 10 tkr' }
        : {}),
    },
    { icon: '🏪', name: 'Loppis', active: false, status: 'Slumpmässig händelse', income: '—', value: 0, noAction: true },
    { icon: '🚗', name: 'Bilbingo', active: false, status: 'Försäsong', income: '—', value: 0, noAction: true },
  ]
  const communityTotal = communityRows.reduce((s, r) => s + r.value, 0)

  return (
    <>
      {/* Kassaöversikt */}
      <SectionCard title="💰 Kassaöversikt" stagger={1}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Saldo</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: club.finances < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
            {formatCurrency(club.finances)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Intäkter / omg</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(weeklyIncome)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Lönekostnader / omg</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: wagePressure ? 'var(--danger)' : 'var(--text-primary)' }}>
            -{formatCurrency(weeklyWages)}
          </span>
        </div>
        {wagePressure && (
          <p style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>
            ⚠️ Lönekostnader överstiger lönebudget ({formatCurrency(club.wageBudget)}/mån)
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Netto / omg</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: netPerRound >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {netPerRound >= 0 ? '+' : ''}{formatCurrency(netPerRound)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 8, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Licensstatus</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: licenseColor }}>
            {licenseIcon} {licenseLabel}
          </span>
        </div>
        {communityStanding !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, marginTop: 6, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lokal ställning</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: communityStanding > 70 ? 'var(--success)' : communityStanding > 40 ? 'var(--text-primary)' : 'var(--danger)' }}>
              {communityStanding}/100
            </span>
          </div>
        )}
      </SectionCard>

      {/* Sponsorer */}
      <SectionCard title="🤝 Sponsorer" stagger={2}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {activeSponsors.length} av {maxSponsors} platser
          </span>
          {weeklySponsors > 0 && (
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
              +{formatCurrency(weeklySponsors)}/omg
            </span>
          )}
        </div>
        {slots.map((_, i) => {
          const sponsor = activeSponsors[i]
          return sponsor ? (
            <div key={sponsor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < maxSponsors - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{sponsor.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{sponsor.category}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(sponsor.weeklyIncome)}/omg</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sponsor.contractRounds} omg kvar</div>
              </div>
            </div>
          ) : (
            <div key={`empty-${i}`} style={{ padding: '7px 0', borderBottom: i < maxSponsors - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Ledig plats</span>
            </div>
          )
        })}
        {activeSponsors.length < maxSponsors && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            {sponsorFeedback && (
              <p style={{ fontSize: 12, color: sponsorFeedback.startsWith('✅') ? 'var(--success)' : 'var(--text-muted)', marginBottom: 8 }}>
                {sponsorFeedback}
              </p>
            )}
            <button
              className="btn btn-outline"
              onClick={() => {
                const result = seekSponsor()
                if (result.success && result.sponsor) {
                  setSponsorFeedback(`✅ ${result.sponsor.name} tecknade avtal! +${formatCurrency(result.sponsor.weeklyIncome)}/omg`)
                } else {
                  setSponsorFeedback(`Ingen intresserad just nu. (2,5 tkr avdraget)`)
                }
                setTimeout(() => setSponsorFeedback(null), 4000)
              }}
              style={{ width: '100%' }}
            >
              📞 Ragga sponsor — 2,5 tkr
            </button>
          </div>
        )}
      </SectionCard>

      {/* Föreningsaktiviteter */}
      <SectionCard title="🎪 Föreningsaktiviteter" stagger={3}>
        {communityMsg && (
          <p style={{ fontSize: 12, color: communityMsg.ok ? 'var(--success)' : 'var(--danger)', marginBottom: 10, fontWeight: 600 }}>
            {communityMsg.ok ? '✓' : '✗'} {communityMsg.text}
          </p>
        )}
        {communityRows.map((row, i) => (
          <div key={row.name} style={{
            padding: '8px 0',
            borderBottom: i < communityRows.length - 1 ? '1px solid var(--border)' : 'none',
            opacity: row.active || !row.noAction ? 1 : 0.4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (row.actionKey || row.upgradeKey) ? 6 : 0 }}>
              <div>
                <span style={{ fontSize: 13, opacity: row.active ? 1 : 0.6 }}>{row.icon} {row.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{row.status}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: row.active ? 'var(--success)' : 'var(--text-muted)' }}>
                {row.income}
              </span>
            </div>
            {row.actionKey && !row.active && (
              <button
                className="btn btn-outline"
                onClick={() => handleActivate(row.actionKey!, row.actionLevel!)}
                disabled={club.finances < (row.actionCost ?? 0)}
                style={{ width: '100%' }}
              >
                {row.actionLabel}
              </button>
            )}
            {row.upgradeKey && row.active && (
              <button
                className="btn btn-ghost"
                onClick={() => handleActivate(row.upgradeKey!, row.upgradeLevel!)}
                disabled={club.finances < (row.upgradeCost ?? 0)}
                style={{ width: '100%' }}
              >
                {row.upgradeLabel}
              </button>
            )}
          </div>
        ))}
        {communityTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 2, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Totalt / hemmamatch</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>~+{Math.round(communityTotal / 1000)} tkr</span>
          </div>
        )}
      </SectionCard>

      {/* Patron & Kommunbidrag */}
      {(patron || kommunBidrag > 0) && (
        <SectionCard title="🏦 Övriga intäkter" stagger={4}>
          {patron && patron.contribution > 0 && (
            <div style={{ marginBottom: kommunBidrag > 0 ? 10 : 0, paddingBottom: kommunBidrag > 0 ? 10 : 0, borderBottom: kommunBidrag > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Patron — {patron.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(patron.contribution)}/sä</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>Dyker upp vid hög lokal ställning (&gt;60). Donerar en gång per säsong.</p>
            </div>
          )}
          {kommunBidrag > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Kommunbidrag</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>+{formatCurrency(kommunBidrag)}/sä</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>Baseras på lokal ställning och ungdomsverksamhet.</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Transferbudget */}
      <SectionCard title="💸 Transferbudget" stagger={5}>
        {(() => {
          const currentTransferBudget = pendingTransferBudget ?? club.transferBudget
          const sliderMax = club.finances > 0 ? Math.min(club.finances * 0.5, club.finances) : 0
          const sliderDisabled = club.finances <= 0
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Avsatt budget</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
                  {formatFinance(currentTransferBudget)}
                </span>
              </div>
              {sliderDisabled ? (
                <p style={{ fontSize: 13, color: 'var(--danger)' }}>
                  Kassan är negativ — transferbudget kan inte sättas just nu.
                </p>
              ) : (
                <>
                  <input
                    type="range"
                    min={0}
                    max={Math.round(sliderMax / 10000) * 10000}
                    step={10000}
                    value={currentTransferBudget}
                    onChange={e => setPendingTransferBudget(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)', marginBottom: 10 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0 tkr</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatFinance(Math.round(sliderMax / 10000) * 10000)}</span>
                  </div>
                  <button
                    className={savedFeedback ? 'btn btn-outline' : 'btn btn-copper'}
                    onClick={() => {
                      setTransferBudget(currentTransferBudget)
                      setSavedFeedback(true)
                      setTimeout(() => setSavedFeedback(false), 1800)
                    }}
                    style={{ width: '100%' }}
                  >
                    {savedFeedback ? '✓ Sparat!' : 'Spara transferbudget'}
                  </button>
                </>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
                Transferbudget räknas aldrig av kassan förrän ett köp görs.
              </p>
            </>
          )
        })()}
      </SectionCard>

      {/* Scouting */}
      <SectionCard title="🔭 Scouting" stagger={6}>
        {(() => {
          const scoutBudget = game.scoutBudget ?? 0
          const canBuyScout = club.finances >= 15000 && scoutBudget < 30
          const scoutMaxReached = scoutBudget >= 30
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Scoutronder kvar</span>
                <span style={{
                  fontSize: 20, fontWeight: 800,
                  color: scoutBudget > 5 ? 'var(--accent)' : scoutBudget > 0 ? 'var(--text-primary)' : 'var(--danger)',
                }}>
                  {scoutBudget}
                </span>
              </div>
              {scoutMaxReached && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Max antal scoutronder uppnått (30).
                </p>
              )}
              <button
                className="btn btn-outline"
                onClick={() => { if (canBuyScout) buyScoutRounds() }}
                disabled={!canBuyScout}
                style={{ width: '100%' }}
              >
                Köp 5 scoutronder — 15 tkr
              </button>
              {club.finances < 15000 && !scoutMaxReached && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
                  Otillräckligt saldo (kräver 15 tkr).
                </p>
              )}
            </>
          )
        })()}
      </SectionCard>
    </>
  )
}
