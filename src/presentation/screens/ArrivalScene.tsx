/**
 * ArrivalScene — stegvis-ackumulativ intro-scen efter klubbval.
 *
 * EN skärm hela scenen. Setting persisterar och dimmas. Repliker
 * läggs till allteftersom — aktuell replik full opacity, föregående dimmade.
 *
 * CSS: src/styles/global.css (.arrival-scene, .h-scene-setting, .h-scene-replica,
 *      .h-scene-speaker, .h-scene-quote, .btn-scene-cta, .beat-progress, .scene-dimmed)
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
  const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [ctaReady, setCtaReady] = useState(false)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  // CTA delay: longer on stage 0 (setting prolog), short on dialog stages
  useEffect(() => {
    setCtaReady(false)
    const delay = currentStage === 0 ? 1700 : 250
    const t = setTimeout(() => setCtaReady(true), delay)
    return () => clearTimeout(t)
  }, [currentStage])

  // Navigate after exit-fade — cleanup prevents ghost-trigger on fast unmount
  useEffect(() => {
    if (currentStage < 4) return
    const t = setTimeout(() => onCompleteRef.current(), 800)
    return () => clearTimeout(t)
  }, [currentStage])

  const weekday = weekdayLabel(currentDate)
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const replicas = [
    {
      speaker: 'MARGARETA · KASSÖR',
      body: `Truppen är ${squadSize}. ${expiringContracts} kontrakt går ut i vår. Kassa ${formatKr(cashKr)}, transferbudget ${formatKr(transferBudgetKr)}. Mer har vi inte.`,
      cta: 'Förstått',
    },
    {
      speaker: 'PELLE · ORDFÖRANDE',
      body: `Plats ${expectedRankLow} till ${expectedRankHigh}. Inget kvalspel. Och håll bygden med oss — tomma läktare är dåligt för bandyn och dåligt för budgeten.`,
      cta: 'Det går bra',
    },
    {
      speaker: 'STURE · LEDAMOT',
      body: getStureLine(clubId),
      cta: 'Då börjar vi',
    },
  ]

  const stageCta = currentStage === 0
    ? 'Sätt dig vid bordet'
    : replicas[currentStage - 1]?.cta ?? null

  return (
    <div className="arrival-scene">

      {/* Persistent header — genre-label + progress */}
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
              className={`dot${i <= currentStage ? ' active' : ''}`}
              style={{ opacity: i <= currentStage ? 0.8 : 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Ackumulativ content-stack */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
          padding: '20px 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Setting — persisterar hela scenen, dimmas när dialog börjar */}
        <div className={`h-scene-setting${currentStage > 0 ? ' scene-dimmed' : ''}`}>
          <strong>{clubName}.</strong>
          {`${cap(weekday)} kväll. Lampan vid klubbhuset lyser. De väntar dig där inne. ${chairman}. ${treasurer}. ${member}. Tre kaffekoppar redan på bordet.`}
        </div>

        {/* Repliker — visas i ordning, aktuell full opacity, föregående dimmade */}
        {replicas.slice(0, currentStage).map((replica, i) => {
          const stageIndex = i + 1
          const isCurrent = stageIndex === currentStage
          return (
            <div key={stageIndex} className={`h-scene-replica${isCurrent ? '' : ' scene-dimmed'}`}>
              <div className="h-scene-speaker">{replica.speaker}</div>
              <div className="h-scene-quote">"{replica.body}"</div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {currentStage < 4 && stageCta && (
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
          <button className="btn-scene-cta" onClick={() => setCurrentStage(s => (s + 1) as 0 | 1 | 2 | 3 | 4)}>
            {stageCta}
          </button>
        </div>
      )}

      {/* Exit overlay */}
      {currentStage >= 4 && (
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
