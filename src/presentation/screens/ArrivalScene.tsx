/**
 * ArrivalScene — kontinuerlig intro-scen efter klubbval.
 *
 * EN sammanhängande scen, inga route-byten, ingen klippning till svart.
 * Bakgrunden består. Genre-etiketten "Ankomsten" består.
 * Fyra step-tillstånd (0→3) + steg 4 = exit-fade till /game/dashboard.
 *
 * Spec: design-system/briefs/ARRIVAL-SCENE-SPEC.md
 * Källkod: design-system/ui_kits/intro_flode/artboards.jsx
 * CSS: src/styles/global.css (.arrival-scene, .scene-cta, .coffee-row, .beat-progress)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ClubExpectation } from '../../domain/enums'
import { getStureLine } from '../../domain/data/arrivalDialogue'

/* ─── formatKr ─── */

function formatKr(kr: number): string {
  if (kr >= 1_000_000) {
    const m = kr / 1_000_000
    // One decimal if not whole number
    return (Number.isInteger(m) ? m.toString() : m.toFixed(1)) + ' mkr'
  }
  return Math.round(kr / 1000) + ' tkr'
}

/* ─── weekdayLabel ─── */

function weekdayLabel(date: Date): string {
  const days = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']
  return days[date.getDay()]
}

/* ─── expectedRankRange ─── */

function expectedRankRange(expectation: string): { low: number; high: number } {
  switch (expectation) {
    case ClubExpectation.WinLeague:      return { low: 1,  high: 4  }
    case ClubExpectation.ChallengeTop:   return { low: 3,  high: 6  }
    case ClubExpectation.MidTable:       return { low: 5,  high: 8  }
    case ClubExpectation.AvoidBottom:    return { low: 8,  high: 12 }
    default:                             return { low: 6,  high: 10 }
  }
}

/* ─── CoffeeRow ─── */

interface CoffeeRowProps {
  initial: string
  name: string
  text: string
  align: 'left' | 'right'
}

function CoffeeRow({ initial, name, text, align }: CoffeeRowProps) {
  return (
    <div className={`coffee-row coffee-row-${align}`}>
      <div className="initial-circle">{initial}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="speaker-name">{name}</div>
        <div className="speaker-quote">{`"${text}"`}</div>
      </div>
    </div>
  )
}

/* ─── ArrivalScene ─── */

interface ArrivalSceneProps {
  clubId: string
  clubName: string
  chairman: string
  treasurer: string
  member: string
  squadSize: number
  expiringContracts: number
  cashKr: number
  transferBudgetKr: number
  expectedRankLow: number
  expectedRankHigh: number
  currentDate: Date
  onComplete: () => void
}

function ArrivalSceneInner({
  clubId,
  clubName,
  chairman,
  treasurer,
  member,
  squadSize,
  expiringContracts,
  cashKr,
  transferBudgetKr,
  expectedRankLow,
  expectedRankHigh,
  currentDate,
  onComplete,
}: ArrivalSceneProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [arrivalDone, setArrivalDone] = useState(false)

  // CTA "Gå in →" fades in after 1.7 s
  useEffect(() => {
    const t = setTimeout(() => setArrivalDone(true), 1700)
    return () => clearTimeout(t)
  }, [])

  // Dim the arrival block when dialogue starts
  const arrivalDim = step >= 1

  // CTA label per step
  const ctaLabel =
    step === 0 ? 'Gå in →' :
    step === 1 ? 'Förstått' :
    step === 2 ? 'Det går bra' :
    step === 3 ? 'Då börjar vi' :
    null

  const ctaDisabled = step === 0 && !arrivalDone

  function handleCTA() {
    if (step === 4) return
    if (step === 3) {
      setStep(4)
      setTimeout(() => onComplete(), 800)
    } else {
      setStep(s => (s + 1) as 0 | 1 | 2 | 3 | 4)
    }
  }

  // Repliker
  const weekday = weekdayLabel(currentDate)

  const margaretaText =
    `Truppen är ${squadSize}. ${expiringContracts} kontrakt går ut i vår. ` +
    `Kassa ${formatKr(cashKr)}, transferbudget ${formatKr(transferBudgetKr)}. ` +
    `Mer har vi inte.`

  const pelleText =
    `Plats ${expectedRankLow} till ${expectedRankHigh}. Inget kvalspel. ` +
    `Och håll bygden med oss — tomma läktare är dåligt för bandyn och dåligt för budgeten.`

  return (
    <div className={`arrival-scene${arrivalDim ? ' dim' : ''}`}>

      {/* Header — genre-etikett, byts aldrig */}
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 24px 0', textAlign: 'center' }}>
        <div
          className="fadein"
          style={{
            animationDelay: '200ms',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 4,
            color: 'var(--accent)',
            opacity: 0,
            textTransform: 'uppercase',
          }}
        >
          ⬩ &nbsp;Ankomsten&nbsp; ⬩
        </div>

        {/* Progress — visas bara när dialog påbörjats */}
        {step >= 1 && (
          <div
            className="beat-progress"
            style={{
              marginTop: 14,
              opacity: 0,
              animation: 'fade-in-static 0.5s ease-out forwards',
              animationDelay: '300ms',
            }}
          >
            {[0, 1, 2, 3].map(i => (
              <span key={i} className={`dot${i < step ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* Inramningsblock — dimmas men försvinner aldrig */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: `${arrivalDim ? 18 : 32}px 36px ${arrivalDim ? 4 : 12}px`,
          textAlign: 'center',
          opacity: arrivalDim ? 0.42 : 1,
          transition: 'opacity 0.9s ease-out, padding-top 0.5s ease-out, padding-bottom 0.5s ease-out',
        }}
      >
        {/* Klubbnamn */}
        <div
          className="fadein"
          style={{
            animationDelay: '300ms',
            fontSize: arrivalDim ? 18 : 26,
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            color: 'var(--text-light)',
            marginBottom: arrivalDim ? 6 : 16,
            transition: 'font-size 0.6s ease-out, margin-bottom 0.6s ease-out',
          }}
        >
          {clubName}.
        </div>

        {/* Tid + plats */}
        <div
          className="fadein"
          style={{
            animationDelay: '700ms',
            fontSize: arrivalDim ? 12 : 16,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: arrivalDim ? 'var(--text-light-secondary)' : 'var(--text-light)',
            opacity: 1,
            marginBottom: arrivalDim ? 4 : 12,
            transition: 'font-size 0.6s ease-out',
          }}
        >
          {weekday.charAt(0).toUpperCase() + weekday.slice(1)} kväll. Lampan vid klubbhuset lyser. De väntar dig där inne.
        </div>

        {/* Styrelse-rad */}
        <div
          className="fadein"
          style={{
            animationDelay: '1200ms',
            fontSize: arrivalDim ? 12 : 16,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: arrivalDim ? 'var(--text-light-secondary)' : 'var(--text-light)',
            opacity: 1,
            transition: 'font-size 0.6s ease-out',
          }}
        >
          {chairman}. {treasurer}. {member}.
          {!arrivalDim && (
            <>
              <br />Tre kaffekoppar redan på bordet.
            </>
          )}
        </div>
      </div>

      {/* Tunn divider — visas när dialog startat */}
      {step >= 1 && (
        <div
          style={{
            padding: '0 32px',
            opacity: 0,
            animation: 'fade-in-static 0.6s ease-out forwards',
            animationDelay: '200ms',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              height: 1,
              background: 'var(--bg-leather)',
              opacity: 0.5,
              margin: '4px 0',
            }}
          />
        </div>
      )}

      {/* Dialogblock — byggs upp kumulativt */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          padding: '14px 20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
      >
        {step >= 1 && (
          <CoffeeRow
            initial="M"
            name="MARGARETA · KASSÖR"
            text={margaretaText}
            align="left"
          />
        )}

        {step >= 2 && (
          <CoffeeRow
            initial="P"
            name="PELLE · ORDFÖRANDE"
            text={pelleText}
            align="right"
          />
        )}

        {step >= 3 && (
          <CoffeeRow
            initial="S"
            name="STURE · LEDAMOT"
            text={getStureLine(clubId)}
            align="left"
          />
        )}
      </div>

      {/* CTA — byts per steg */}
      {ctaLabel !== null && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '12px 20px 28px',
            opacity: step === 0 && !arrivalDone ? 0 : 1,
            animation: step === 0 ? 'fade-in-static 0.6s ease-out forwards' : 'none',
            animationDelay: step === 0 ? '1700ms' : '0ms',
            transition: step > 0 ? 'opacity 0.3s' : 'none',
            pointerEvents: ctaDisabled ? 'none' : 'auto',
          }}
        >
          <button
            className="scene-cta"
            disabled={ctaDisabled}
            onClick={handleCTA}
          >
            {ctaLabel}
          </button>
        </div>
      )}

      {/* Steg 4 — exit overlay */}
      {step === 4 && (
        <div className="arrival-exit">
          <span>→ Dashboard</span>
        </div>
      )}
    </div>
  )
}

/* ─── ArrivalScene (wrapper läser från gameStore) ─── */

export function ArrivalScene() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)

  // If no game exists, redirect to start
  if (!game) {
    navigate('/', { replace: true })
    return null
  }

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) {
    navigate('/', { replace: true })
    return null
  }

  const board = managedClub.board

  const chairman = board
    ? `${board.chairman.firstName} ${board.chairman.lastName}`
    : 'Ordföranden'
  const treasurer = board
    ? `${board.treasurer.firstName} ${board.treasurer.lastName}`
    : 'Kassören'
  const member = board
    ? `${board.member.firstName} ${board.member.lastName}`
    : 'Sture'

  const squadSize = managedClub.squadPlayerIds.length

  const expiringContracts = game.players.filter(
    p => managedClub.squadPlayerIds.includes(p.id) &&
         p.contractUntilSeason <= game.currentSeason
  ).length

  const cashKr = managedClub.finances
  const transferBudgetKr = managedClub.transferBudget

  const rankRange = expectedRankRange(managedClub.boardExpectation)

  const currentDate = new Date(game.currentDate)

  return (
    <ArrivalSceneInner
      clubId={managedClub.id}
      clubName={managedClub.name}
      chairman={chairman}
      treasurer={treasurer}
      member={member}
      squadSize={squadSize}
      expiringContracts={expiringContracts}
      cashKr={cashKr}
      transferBudgetKr={transferBudgetKr}
      expectedRankLow={rankRange.low}
      expectedRankHigh={rankRange.high}
      currentDate={currentDate}
      onComplete={() => navigate('/game/dashboard', { replace: true })}
    />
  )
}
