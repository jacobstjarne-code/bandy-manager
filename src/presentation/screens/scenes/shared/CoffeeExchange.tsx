/**
 * CoffeeExchange — en samtals-utbyte i kafferummet.
 * Två rader: speakerA till vänster, speakerB till höger (höger = row-reverse).
 *
 * Pixel-värden från docs/mockups/kafferummet_mockup.html. Justera inte.
 */

// scene-fade-in-exchange bor i global.css (2026-08-31). Den låg tidigare i en
// inline <style> här, vilket gjorde keyframet beroende av att MINST en exchange
// renderades — en enradig scen (narratorLine, noll exchanges) fick då aldrig
// keyframet och blev liggande på opacity: 0.

import { wrapQuote } from '../../../../domain/utils/quoteWrap'
import type { CoffeeTurn } from '../../../../domain/services/coffeeRoomService'

interface SpeakerRowProps {
  initial: string
  speakerName: string
  text: string
  align: 'left' | 'right'
}

function SpeakerRow({ initial, speakerName, text, align }: SpeakerRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        textAlign: align,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--bg-dark-elevated)',
          border: '1px solid var(--bg-leather)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          fontSize: 13,
          color: 'var(--text-light-secondary)',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        {initial}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div className="h-label h-label-light">
          {speakerName}
        </div>
        {/* T3 (2026-07-13): repliken är aktiv dialog spelaren läser just nu,
            inget dimmed-tillstånd bakom sig — --text-light, inte -secondary. */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 13,
            color: 'var(--text-light)',
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          {wrapQuote(text)}
        </div>
      </div>
    </div>
  )
}

interface Props {
  exchange: CoffeeTurn[]
  delay: number
}

export function CoffeeExchange({ exchange, delay }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: 0,
        animation: 'scene-fade-in-exchange 0.6s ease-out forwards',
        animationDelay: `${delay}ms`,
      }}
    >
      {exchange.map(([speaker, text], index) => (
        <SpeakerRow
          key={`${index}-${speaker}`}
          initial={speaker.charAt(0).toUpperCase()}
          speakerName={speaker}
          text={text}
          align={index % 2 === 0 ? 'left' : 'right'}
        />
      ))}
    </div>
  )
}
