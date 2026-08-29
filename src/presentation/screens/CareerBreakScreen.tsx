/**
 * O13 / M11 — TRÄNARMARKNADEN (DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * EN skärm, TVÅ steg, i domens ordning: `stage: 'season'` visar vad som hände
 * medan du satt hemma, `stage: 'market'` ställer frågan. Att de bor i samma
 * komponent är avsiktligt — ordningen ("Först ser du säsongen. Sedan får du
 * frågan") blir då omöjlig att kringgå med en direktlänk, till skillnad från
 * två separata routes.
 *
 * All text kommer från src/domain/data/careerBreakText.ts och är '[Opus]'
 * tills Opus skrivit den. Skärmen renderar därför strukturen, inte språket.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ordinal } from '../utils/formatters'
import { seasonSpanLabel } from '../../domain/utils/seasonYear'
import type { CareerOffer } from '../../domain/services/careerBreakService'
import {
  CAREER_BREAK_SEASON_EYEBROW,
  CAREER_BREAK_SEASON_TITLE,
  CAREER_BREAK_CONTINUE_CTA,
  CAREER_BREAK_MARKET_EYEBROW,
  CAREER_BREAK_MARKET_TITLE,
  CAREER_BREAK_FORMER_CLUB_BADGE,
  CAREER_BREAK_ACCEPT_CTA,
  CAREER_BREAK_NO_CALL_TITLE,
  CAREER_BREAK_NO_CALL_BODY,
  CAREER_BREAK_NEW_CAREER_CTA,
  careerBreakSeasonIntro,
  careerBreakSeasonLine,
  careerBreakVerdict,
  careerBreakMarketIntro,
  careerOfferReason,
} from '../../domain/data/careerBreakText'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      overflowY: 'auto', maxWidth: 430, margin: '0 auto', zIndex: 1000,
    }}>
      <div style={{ padding: '32px 20px 40px' }}>{children}</div>
    </div>
  )
}

function OfferCard({ offer, onAccept }: { offer: CareerOffer; onAccept: () => void }) {
  return (
    <div
      className="card-round"
      style={{
        padding: '14px 16px',
        marginBottom: 10,
        border: offer.isFormerClub
          ? '1px solid color-mix(in srgb, var(--accent) 45%, transparent)'
          : '1px solid var(--border)',
      }}
    >
      {offer.isFormerClub && (
        <p className="h-label" style={{ color: 'var(--accent)', marginBottom: 6 }}>
          {CAREER_BREAK_FORMER_CLUB_BADGE}
        </p>
      )}
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
        {offer.clubName}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        {ordinal(offer.lastPosition)} plats
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>
        {offer.pitch}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
        {careerOfferReason(offer)}
      </p>
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={onAccept}>
        {CAREER_BREAK_ACCEPT_CTA}
      </button>
    </div>
  )
}

export function CareerBreakScreen() {
  const game = useGameStore(s => s.game)
  const revealCareerMarket = useGameStore(s => s.revealCareerMarket)
  const acceptCareerOffer = useGameStore(s => s.acceptCareerOffer)
  const clearFiredGame = useGameStore(s => s.clearFiredGame)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const breakState = game?.careerBreak
  if (!game || !breakState) {
    return <Shell><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</p></Shell>
  }

  const { report, offers, stage, careerOver } = breakState

  function handleNewCareer() {
    clearFiredGame()
    navigate('/', { replace: true })
  }

  function handleAccept(clubId: string) {
    if (busy) return
    setBusy(true)
    // Klubbytet nollställer managerFired, så GameShells omdirigering till
    // /game/game-over slutar gälla i samma ögonblick — därav replace till
    // portalen direkt, inte en tillbakaväg hit.
    if (acceptCareerOffer(clubId)) navigate('/game/dashboard', { replace: true })
    else setBusy(false)
  }

  if (stage === 'season') {
    return (
      <Shell>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '3px',
          textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12,
        }}>
          {CAREER_BREAK_SEASON_EYEBROW}
        </p>
        <h1 className="h-display-md" style={{ color: 'var(--text-primary)', marginBottom: 16 }}>
          {CAREER_BREAK_SEASON_TITLE}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
          {careerBreakSeasonIntro(report)}
        </p>

        <div className="card-sharp" style={{ padding: '14px 16px', marginBottom: 16 }}>
          <p className="h-label" style={{ marginBottom: 12 }}>
            {report.formerClubName}
          </p>
          {report.seasons.map(line => (
            <div key={line.season} style={{
              display: 'flex', justifyContent: 'space-between', gap: 10,
              padding: '6px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {seasonSpanLabel(line.season)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right' }}>
                {careerBreakSeasonLine(line, report)}
              </span>
            </div>
          ))}
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12 }}>
            {careerBreakVerdict(report)}
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', letterSpacing: '1.5px', textTransform: 'uppercase' }}
          onClick={revealCareerMarket}
        >
          {CAREER_BREAK_CONTINUE_CTA}
        </button>
      </Shell>
    )
  }

  // stage === 'market'
  return (
    <Shell>
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '3px',
        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12,
      }}>
        {CAREER_BREAK_MARKET_EYEBROW}
      </p>

      {careerOver ? (
        <>
          <h1 className="h-display-md" style={{ color: 'var(--text-primary)', marginBottom: 16 }}>
            {CAREER_BREAK_NO_CALL_TITLE}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
            {CAREER_BREAK_NO_CALL_BODY}
          </p>
        </>
      ) : (
        <>
          <h1 className="h-display-md" style={{ color: 'var(--text-primary)', marginBottom: 16 }}>
            {CAREER_BREAK_MARKET_TITLE}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
            {careerBreakMarketIntro(offers.length)}
          </p>
          {offers.map(o => (
            <OfferCard key={o.clubId} offer={o} onAccept={() => handleAccept(o.clubId)} />
          ))}
          <div style={{ height: 20 }} />
        </>
      )}

      <button
        className="btn"
        style={{ width: '100%', letterSpacing: '1.5px', textTransform: 'uppercase' }}
        onClick={handleNewCareer}
      >
        {CAREER_BREAK_NEW_CAREER_CTA}
      </button>
    </Shell>
  )
}
