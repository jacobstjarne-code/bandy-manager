/**
 * SundayTrainingScene — säsongens första söndagsträning.
 * Mörk bakgrund, fallande snö, sex spelare på isen.
 *
 * Pixel-värden från docs/mockups/training_mockup.html. Justera inte.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import {
  SUNDAY_TRAINING_PLAYERS,
  SUNDAY_TRAINING_CHOICES,
  SUNDAY_TRAINING_META,
} from '../../../domain/data/scenes/sundayTrainingScene'
import { PlayerPosition } from '../../../domain/enums'
import { getClimateForRegionAndMonth } from '../../../domain/data/regionalClimate'
import { SceneHeader } from './shared/SceneHeader'
import { SceneChoiceButton } from './shared/SceneChoiceButton'
import { SnowParticles } from './shared/SnowParticles'
import { SundayTrainingPlayerList } from './shared/SundayTrainingPlayerList'

interface Props {
  game: SaveGame
  onComplete: (choiceId: string) => void
}

export function SundayTrainingScene({ game, onComplete }: Props) {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  const arena = club?.arenaName ?? 'klubbarenan'
  const seed = game.currentSeason * 9301 + game.managedClubId.length * 49297 + 1

  // M64 (textaudit 2026-07-04): datum/temp hämtades tidigare hårdkodat
  // ('4 oktober · −2°C') oavsett klubbens region eller säsongens faktiska
  // startdatum — motsade väder-/kalendersystemet på grannytor (oktobersnitt
  // spänner -2°C i Norrbotten till +8°C i Västra Götaland). Hämtas nu från
  // matchday-1-fixturens datum + klubbens regionala klimatdata.
  const firstFixture = game.fixtures.find(f => f.matchday === 1)
  const fixtureDate = firstFixture?.date ? new Date(firstFixture.date) : null
  const dateLabel = fixtureDate
    ? fixtureDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })
    : '4 oktober'
  const climateMonth = fixtureDate ? fixtureDate.getMonth() + 1 : 10
  const avgTemp = club ? getClimateForRegionAndMonth(club.region, climateMonth).avgTemp : -2
  const tempLabel = `${avgTemp > 0 ? '+' : ''}${avgTemp}°C`
  const dateText = SUNDAY_TRAINING_META.date
    .replace('{date}', dateLabel)
    .replace('{temp}', tempLabel)
    .replace('{arena}', arena)

  // Trait-based casting — texts describe character traits, casting must match
  const squadPlayers = game.players.filter(
    p => p.clubId === game.managedClubId && p.position !== PlayerPosition.Goalkeeper
  )
  const castNames: Record<string, string> = {}
  const castIds: Record<string, string> = {}
  if (squadPlayers.length >= 3) {
    const profScore = (p: typeof squadPlayers[0]) =>
      (p.attributes.workRate + (p.loyaltyScore ?? 5) * 10) / 2

    const earliest = [...squadPlayers].sort((a, b) => profScore(b) - profScore(a))[0]
    const remaining1 = squadPlayers.filter(p => p.id !== earliest.id)
    const phone = [...remaining1].sort((a, b) => a.attributes.workRate - b.attributes.workRate)[0]
    const remaining2 = remaining1.filter(p => p.id !== phone.id)
    const cold = [...remaining2].sort((a, b) => a.morale - b.morale)[0]
    const remaining3 = remaining2.filter(p => p.id !== cold.id)

    castNames['{earliest}'] = earliest.lastName
    castIds['{earliest}'] = earliest.id
    castNames['{phone}'] = phone.lastName
    castIds['{phone}'] = phone.id
    castNames['{cold}'] = cold.lastName
    castIds['{cold}'] = cold.id

    // M64 (b): tre PÅHITTADE efternamn ("Andersson, Eriksson, Karlsson") ersatt
    // med tre faktiska truppmedlemmar. Om truppen inte räcker till (< 6
    // fältspelare totalt) faller {group3} tillbaka på den påhittade texten —
    // samma säkerhetsnät som redan gällde för alla fyra namnen.
    if (remaining3.length >= 3) {
      castNames['{group3}'] = remaining3.slice(0, 3).map(p => p.lastName).join(', ')
    } else {
      castNames['{group3}'] = 'Andersson, Eriksson, Karlsson'
    }
  }

  function resolveToken(s: string): string {
    return s.replace(/\{earliest\}|\{phone\}|\{cold\}|\{group3\}/g, m => castNames[m] ?? m)
  }

  const resolvedPlayers = SUNDAY_TRAINING_PLAYERS.map(p => {
    const name = resolveToken(p.name)
    return { ...p, initial: name[0] ?? p.initial, name }
  })

  const resolvedChoices = SUNDAY_TRAINING_CHOICES.map(c => ({
    ...c,
    id: c.id.replace(/\{earliest\}|\{phone\}|\{cold\}/g, m => castIds[m] ?? m),
    label: resolveToken(c.label),
  }))

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: 720,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Bakgrund */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(184,136,76,0.10) 0%, transparent 70%), linear-gradient(180deg, var(--bg-scene) 0%, color-mix(in srgb, var(--bg-scene) 50%, var(--bg-scene-deep) 50%) 60%, color-mix(in srgb, var(--bg-scene-deep) 70%, var(--bg-scene) 30%) 100%)',
        }}
      />

      <SnowParticles seed={seed} />

      {/* Innehåll */}
      <div
        style={{
          position: 'relative',
          padding: '30px 24px 24px',
          zIndex: 2,
        }}
      >
        <SceneHeader
          genre="I DETTA ÖGONBLICK"
          title={SUNDAY_TRAINING_META.title}
          subtitle={dateText}
        />

        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-light)',
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {SUNDAY_TRAINING_META.headline}
        </div>
        <div className="h-scene-helper" style={{ marginBottom: 20 }}>
          {SUNDAY_TRAINING_META.subtitle}
        </div>

        <SundayTrainingPlayerList players={resolvedPlayers} />

        {/* Val */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginTop: 30,
          }}
        >
          {resolvedChoices.map(c => (
            <SceneChoiceButton key={c.id} choice={c} onClick={onComplete} />
          ))}
        </div>
      </div>
    </div>
  )
}
