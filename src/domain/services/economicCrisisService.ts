// DREAM-002: Ekonomisk kris som narrativ bana
// Triggas när finances < -200 000 kr.
// Tre events sprids ut över 8 omgångar.

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'

export interface EconomicCrisisCheckResult {
  event: GameEvent | null
  /** Oförändrad (game.economicCrisisState) i alla grenar utom fas 1:s
   *  ambient-övergång nedan — se den grenens kommentar. */
  economicCrisisState: SaveGame['economicCrisisState']
}

/**
 * @cites game.sponsors, roundNumber
 */
export function checkEconomicCrisis(game: SaveGame, nextMatchday: number): EconomicCrisisCheckResult {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub || managedClub.finances >= -200_000) return { event: null, economicCrisisState: game.economicCrisisState }

  const crisis = game.economicCrisisState
  const alreadyResolved = crisis?.phase === 'resolved'
  if (alreadyResolved) return { event: null, economicCrisisState: game.economicCrisisState }

  // Phase 1 — awareness (fires once, immediately when finances drop below -200k)
  if (!crisis) {
    const eventId = `event_crisis_awareness_${game.currentSeason}`
    if ((game.resolvedEventIds ?? []).includes(eventId)) return { event: null, economicCrisisState: game.economicCrisisState }
    if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return { event: null, economicCrisisState: game.economicCrisisState }

    // Jacobs dom 2026-08-24 (O2 lager 2): accept_meeting/propose_club var
    // byte-identiska val (samma startEconomicCrisis-effekt, ingen text
    // arkiverades) — ett genuint tomt val, till skillnad från bandyLetter/
    // schoolAssignment vars knappar skriver olika arkivtext. Konverterat
    // till ambient (choices:[]) — tillståndsövergången till fas 'awareness'
    // sker HÄR, vid genereringen, inte via en senare choice-resolution
    // (choices.length===0 triggar ingen effekt-applicering i
    // eventResolver.ts, se dess egen kommentar "atmospheric auto-resolved
    // events — just remove from queue"). Samma init-logik som tidigare låg
    // i eventResolver.ts:s 'startEconomicCrisis'-gren, flyttad hit.
    const currentMatchday = game.fixtures
      .filter(f => f.status === 'completed' && !f.isCup)
      .reduce((m, f) => Math.max(m, f.roundNumber), 0)
    return {
      event: {
        id: eventId,
        type: 'criticalEconomy',
        title: 'Styrelsen ringer — krismöte',
        body: `Anders Lindgren (styrelsen) ringer klockan 22:17.\n\n"Jag har sett siffrorna. Vi är på ${managedClub.finances.toLocaleString('sv-SE')} kr. Det här är inte ett sponsorproblem — det är ett strukturellt problem. Jag vill träffa dig. I morgon. Inte på klubbkontoret. På Stadshotellet. Jag bjuder."`,
        sender: { name: 'Anders Lindgren', role: 'Styrelsens ordförande' },
        choices: [],
        resolved: false,
        priority: 'critical',
      },
      economicCrisisState: {
        startedSeason: game.currentSeason,
        startedMatchday: currentMatchday,
        phase: 'awareness',
        eventsFired: ['awareness'],
      },
    }
  }

  // Phase 2 — pressure (3 matchdays after phase 1 started)
  if (crisis.phase === 'awareness' && !crisis.eventsFired.includes('pressure')) {
    if (nextMatchday < crisis.startedMatchday + 3) return { event: null, economicCrisisState: game.economicCrisisState }
    const eventId = `event_crisis_pressure_${game.currentSeason}`
    if ((game.resolvedEventIds ?? []).includes(eventId)) return { event: null, economicCrisisState: game.economicCrisisState }
    if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return { event: null, economicCrisisState: game.economicCrisisState }

    // PÅSTÅENDEKARTAN omsvep (2026-08-24), ÅTKOMST-FANNS-ANVÄNDES-INTE: texten
    // hårdkodade "Holmström Bygg" och "elva år" — game.sponsors fanns i scope
    // men lästes aldrig. Fixat till "sponsorn med högst veckointäkt" (den
    // rimligaste definitionen av "huvudsponsor" — ingen tier==='fixed'-
    // markering existerar någonstans i kodbasen, grep bekräftat). "Elva år"
    // strukets medvetet, inte ersatt med en beräkning: Sponsor.signedRound
    // finns, men dess skopning (global spelordning vs. per-säsong) är inte
    // verifierad, och en gissad årsberäkning vore samma sorts fabricerat
    // tal som det som ströks — Jacobs egen regel (2026-08-24): hellre en
    // sann, tidlös rad än en uppfunnen siffra.
    const mainSponsor = [...(game.sponsors ?? [])]
      .filter(s => s.contractRounds > 0)
      .sort((a, b) => b.weeklyIncome - a.weeklyIncome)[0]
    const sponsorName = mainSponsor?.name ?? 'Huvudsponsorn'

    return {
      event: {
        id: eventId,
        type: 'criticalEconomy',
        title: '⚠️ Huvudsponsorn hotar lämna',
        body: `Huvudsponsorns VD har ringt ordföranden.\n\n"Vi har varit med länge nu. Men vi kan inte vara klubbens lösning på allt. Antingen visar ni en plan inom två veckor, eller så står vår logga inte på tröjan nästa säsong."`,
        sender: { name: sponsorName, role: 'Huvudsponsor' },
        choices: [
          {
            id: 'present_plan',
            label: 'Presentera en ekonomisk plan (−20 000 kr)',
            effect: { type: 'startEconomicCrisis', crisisPhase: 'pressure', value: -20_000 },
          },
          {
            id: 'accept_loss',
            label: 'Acceptera — vi klarar oss utan dem',
            effect: { type: 'resolveEconomicCrisis', crisisPhase: 'natural_recovery' },
          },
        ],
        resolved: false,
        priority: 'critical',
      },
      economicCrisisState: game.economicCrisisState,
    }
  }

  // Phase 3 — decision (5 matchdays after phase 1)
  if ((crisis.phase === 'awareness' || crisis.phase === 'pressure') && !crisis.eventsFired.includes('decision')) {
    if (nextMatchday < crisis.startedMatchday + 5) return { event: null, economicCrisisState: game.economicCrisisState }
    const eventId = `event_crisis_decision_${game.currentSeason}`
    if ((game.resolvedEventIds ?? []).includes(eventId)) return { event: null, economicCrisisState: game.economicCrisisState }
    if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return { event: null, economicCrisisState: game.economicCrisisState }

    // Find best managed player to offer as sale option
    const managedPlayers = game.players
      .filter(p => p.clubId === game.managedClubId && !p.isClubLegend)
      .sort((a, b) => b.currentAbility - a.currentAbility)
    const bestPlayer = managedPlayers[0]
    const bestName = bestPlayer ? `${bestPlayer.firstName} ${bestPlayer.lastName}` : 'bäste spelaren'

    // Jacobs dom 2026-08-24 (O2 lager 1): "lojalitet −30" var tidigare
    // aldrig kodad — resolveEconomicCrisis rörde bara pengarna, ingen
    // mecenat straffades, vilket gjorde ask_mecenat en fri vinst på
    // 100 000 kr jämfört med take_loan. Tie-break vid flera aktiva
    // mecenater: den med HÖGST happiness (Jacobs skäl — "den som har mest
    // att förlora blir mest besviken, det gör valet dyrast när det ser
    // tryggast ut"). Genereringsgrind: valet erbjuds bara när minst en
    // aktiv mecenat finns — tidigare erbjöds det ovillkorat.
    const activeMecenater = (game.mecenater ?? []).filter(m => m.isActive)
    const richestMecenat = activeMecenater.length > 0
      ? [...activeMecenater].sort((a, b) => b.happiness - a.happiness)[0]
      : undefined

    return {
      event: {
        id: eventId,
        type: 'criticalEconomy',
        title: 'Två vägar ur krisen',
        body: richestMecenat
          ? `Ekonomichefen har räknat. Det finns tre vägar:\n\n**A. Sälj ${bestName}.** Budet ligger på 350 000 kr. Det löser skulden men laget försvagas.\n\n**B. Kommunlån.** 300 000 kr över tre år. Räntan äter hälften av intäkterna. Politiskt känsligt.\n\n**C. Be mecenaten om hjälp.** Om ni har en aktiv mecenat kan han täcka 200 000 kr. Men det kostar i lojalitet.`
          : `Ekonomichefen har räknat. Det finns två vägar:\n\n**A. Sälj ${bestName}.** Budet ligger på 350 000 kr. Det löser skulden men laget försvagas.\n\n**B. Kommunlån.** 300 000 kr över tre år. Räntan äter hälften av intäkterna. Politiskt känsligt.`,
        sender: { name: 'Johan Bergstedt', role: 'Ekonomichef' },
        relatedPlayerId: bestPlayer?.id,
        choices: [
          {
            id: 'sell_star',
            label: `Sälj ${bestName} (+350 000 kr)`,
            // L4 (2026-08-26): D1 punkt 3s fält var byggda men ospårade tills
            // nu (contentContract.ts:287) — sell_star är det enda av de tre
            // valen som är irreversibelt (spelaren försvinner permanent), och
            // etiketten visar bara vinsten. Utan en egen konsekvensrad ser
            // valet ut som ett rent plus. consequenceLevel='costly' + ett
            // namngivet resurs-costLabel (samma mönster som D1s eget exempel
            // "Kostar en plats i truppen") gör den verkliga kostnaden synlig
            // utan att märka ut valet som "fel" (facit-förbudet, O12).
            consequenceLevel: 'costly',
            costLabel: `Kostar ${bestName} i truppen`,
            irreversible: true,
            effect: { type: 'resolveEconomicCrisis', value: 350_000, crisisPhase: 'sold_star', removePlayerId: bestPlayer?.id },
          },
          {
            id: 'take_loan',
            label: 'Kommunlån (+300 000 kr, löpande kostnad)',
            effect: { type: 'resolveEconomicCrisis', value: 300_000, crisisPhase: 'loan' },
          },
          ...(richestMecenat ? [{
            id: 'ask_mecenat',
            label: 'Be mecenaten (+200 000 kr, lojalitet −30)',
            // targetMecenatId + mecenatHappinessDelta läses av
            // resolveEconomicCrisis-hanteraren själv (eventResolver.ts) —
            // INTE multiEffect/subEffects. resolveEconomicCrisis saknar en
            // gren i multiEffect-undertypsswitchen (samma felklass 2.5/O2
            // redan fångat två gånger denna vecka), så effekten hade blivit
            // en tyst no-op om den lindats in i multiEffect istället.
            effect: {
              type: 'resolveEconomicCrisis' as const,
              value: 200_000,
              crisisPhase: 'mecenat',
              targetMecenatId: richestMecenat.id,
              mecenatHappinessDelta: -30,
            },
          }] : []),
        ],
        resolved: false,
        priority: 'critical',
        systemhandelse: true,  // O19: sell_star-valet är 5/5 i DOM_VARSLET_KLASSIFICERING_2026-08-17.md
        // Medium 4 (Skutskär-auditen, 2026-08-22): den STARKASTE kandidaten av
        // de fyra kritiska typerna (contentContract.ts's egen analys, rad
        // ~212) — namngiven avsändare som konkret väntar på ett beslut, ett
        // av de tre valen (sell_star) faktiskt irreversibelt. Instans-satt,
        // inte typ-nivå: fas 1/2 (bastu-nivå brådska, ingen konkret ultimatum
        // än) förblir 'normal' via samma GameEventType.
        whyNow: { whyNowPerson: 'Johan Bergstedt' },
      },
      economicCrisisState: game.economicCrisisState,
    }
  }

  return { event: null, economicCrisisState: game.economicCrisisState }
}
