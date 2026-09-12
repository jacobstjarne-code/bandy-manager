/**
 * O13 / M11 — TRÄNARMARKNADEN, store-sidan (docs/dom/DOM_TRANARMARKNADEN_2026-08-26.md).
 *
 * Tre steg, i domens ordning och ingen annan:
 *   1. `startCareerBreak()` — säsongen spelas utan spelaren, `stage: 'season'`.
 *   2. `revealCareerMarket()` — först NU ställs frågan, `stage: 'market'`.
 *   3. `acceptCareerOffer(clubId)` — bytet.
 *
 * Steg 2 finns som eget anrop just för att ordningen ska vara omöjlig att
 * kringgå: "Att erbjudas ett jobb innan du vet hur det gick är att förlora det
 * ögonblick där avskedet betyder något." Erbjudandena BERÄKNAS redan i steg 1
 * (de är en följd av vad som hände under uppehållet), men de kan inte
 * renderas förrän stage är 'market'.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import { switchManagedClub } from '../../../application/useCases/switchManagedClub'
import { detectSceneTrigger } from '../../../domain/services/sceneTriggerService'
import { saveSaveGame } from '../../../infrastructure/persistence/saveGameStorage'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

export function careerBreakActions(get: Get, set: Set) {
  return {
    /**
     * Kör uppehållet. Hela use-caset laddas med en enda dynamisk import först
     * när spelaren väljer karriäruppehåll. Den tidigare, osäkra varianten
     * gjorde två överlappande importer inne i use-caset; det är inte samma
     * graf. En import här låter modulens egna statiska beroenden laddas i
     * normal ordning och håller roundProcessor/matchCore borta från startup.
     */
    startCareerBreak: async (): Promise<SaveGame | null> => {
      const { game } = get()
      if (!game || !game.managerFired || game.careerBreak) return null
      const { simulateCareerBreak } = await import('../../../application/useCases/simulateCareerBreak')
      const { game: simulated } = simulateCareerBreak(game)
      set({ game: simulated })
      void saveSaveGame(simulated).then(r => {
        if (!r.success) console.error('startCareerBreak: kunde inte spara uppehållet:', r.error)
      })
      return simulated
    },

    /** Domens ordning: säsongen är sedd, nu — och först nu — kommer frågan. */
    revealCareerMarket: () => {
      const { game } = get()
      if (!game?.careerBreak || game.careerBreak.stage === 'market') return
      const updated: SaveGame = {
        ...game,
        careerBreak: { ...game.careerBreak, stage: 'market' },
      }
      set({ game: updated })
      void saveSaveGame(updated).then(r => {
        if (!r.success) console.error('revealCareerMarket: kunde inte spara:', r.error)
      })
    },

    acceptCareerOffer: (clubId: string): boolean => {
      const { game } = get()
      if (!game?.careerBreak) return false
      if (!game.careerBreak.offers.some(o => o.clubId === clubId)) return false
      let switched = switchManagedClub(game, clubId)
      // Samma mönster som gameStore.newGame: den nya klubbens inledande scen
      // (styrelsemötet) triggas explicit här. detectSceneTrigger körs annars
      // först vid nästa advance, och spelaren hade landat i portalen hos en
      // klubb vars styrelse aldrig sagt ett ord om varför de anställde honom.
      const sceneId = detectSceneTrigger(switched)
      if (sceneId) {
        switched = { ...switched, pendingScene: { sceneId, triggeredAt: switched.currentDate } }
      }
      set({ game: switched })
      void saveSaveGame(switched).then(r => {
        if (!r.success) console.error('acceptCareerOffer: kunde inte spara den nya klubben:', r.error)
      })
      return true
    },
  }
}
