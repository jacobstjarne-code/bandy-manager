/**
 * ArrivalScene — kontinuerlig intro-scen efter klubbval.
 *
 * Beat-modell (4 beats): setting-prolog + 3 dialog-beats (Margareta, Pelle, Sture).
 * EN replik i taget, föregående beat försvinner — board-meeting-mönstret.
 *
 * CSS: src/styles/global.css (.arrival-scene, .scene-cta, .beat-progress)
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ClubExpectation } from '../../domain/enums'
import { getStureLine } from '../../domain/data/arrivalDialogue'

/* ─── formatKr ─── */

function formatKr(kr: number): string {
  if (kr >= 1_000_000) {
    const m = kr / 1_000_000
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

/* ─── ArrivalSceneInner ─── */

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

type Beat =
  | { type: 'setting'; lines: string[]; cta: string }
  | { type: 'dialog'; speaker: string; body: string; cta: string }

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
  const [currentBeat, setCurrentBeat] = useState(0)
  const [ctaReady, setCtaReady] = useState(false)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  // CTA delay: longer on beat 0 (setting), short on dialog beats
  useEffect(() => {
    setCtaReady(false)
    const delay = currentBeat === 0 ? 1700 : 250
    const t = setTimeout(() => setCtaReady(true), delay)
    return () => clearTimeout(t)
  }, [currentBeat])

  // Navigate after exit-fade — cleanup prevents ghost-trigger on fast unmount
  useEffect(() => {
    if (currentBeat < 4) return
    const t = setTimeout(() => onCompleteRef.current(), 800)
    return () => clearTimeout(t)
  }, [currentBeat])

  const weekday = weekdayLabel(currentDate)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const beats: Beat[] = [
    {
      type: 'setting',
      lines: [
        `${clubName}.`,
        `${cap(weekday)} kväll. Lampan vid klubbhuset lyser. De väntar dig där inne.`,
        `${chairman}. ${treasurer}. ${member}. Tre kaffekoppar redan på bordet.`,
      ],
      cta: 'Sätt dig vid bordet',
    },
    {
      type: 'dialog',
      speaker: 'MARGARETA · KASSÖR',
      body: `Truppen är ${squadSize}. ${expiringContracts} kontrakt går ut i vår. Kassa ${formatKr(cashKr)}, transferbudget ${formatKr(transferBudgetKr)}. Mer har vi inte.`,
      cta: 'Förstått',
    },
    {
      type: 'dialog',
      speaker: 'PELLE · ORDFÖRANDE',
      body: `Plats ${expectedRankLow} till ${expectedRankHigh}. Inget kvalspel. Och håll bygden med oss — tomma läktare är dåligt för bandyn och dåligt för budgeten.`,
      cta: 'Det går bra',
    },
    {
      type: 'dialog',
      speaker: 'STURE · LEDAMOT',
      body: getStureLine(clubId),
      cta: 'Då börjar vi',
    },
  ]

  const beat = currentBeat < beats.length ? beats[currentBeat] : null

  return (
    <div className="arrival-scene">

      {/* Persistent header — genre-label + beat-progress */}
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
        <div className="beat-progress" style={{ marginTop: 14 }}>
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              className={`dot${i <= currentBeat ? ' active' : ''}`}
              style={{ opacity: i <= currentBeat ? 0.8 : 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Beat content — key triggers re-animation on each beat */}
      {beat && (
        <div
          key={currentBeat}
          style={{
            flex: 1,
            position: 'relative',
            zIndex: 1,
            padding: '40px 32px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            animation: 'fade-in-static 0.35s ease-out forwards',
          }}
        >
          {beat.type === 'setting' ? (
            <div style={{ textAlign: 'center' }}>
              {beat.lines.map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: 'var(--text-light)',
                    lineHeight: 1.8,
                    marginBottom: i === 0 ? 10 : 6,
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <div style={{ padding: '0 4px' }}>
              <p style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 2.5,
                color: 'var(--accent)',
                textTransform: 'uppercase' as const,
                marginBottom: 16,
              }}>
                {beat.speaker}
              </p>
              <p style={{
                fontSize: 16,
                fontFamily: 'Georgia, serif',
                color: 'var(--text-light)',
                fontStyle: 'italic',
                lineHeight: 1.55,
              }}>
                "{beat.body}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {beat && (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '12px 20px 28px',
            opacity: ctaReady ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
            pointerEvents: ctaReady ? 'auto' : 'none',
          }}
        >
          <button className="scene-cta" onClick={() => setCurrentBeat(b => b + 1)}>
            {beat.cta}
          </button>
        </div>
      )}

      {/* Exit overlay */}
      {currentBeat >= 4 && (
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
