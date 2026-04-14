import type { SaveGame, Sponsor, CommunityActivities } from '../../entities/SaveGame'
import { InboxItemType } from '../../enums'
import { executeTransfer } from '../transferService'
import { applyFinanceChange } from '../economyService'
import { recordInteraction, recordPressRefusal } from '../journalistService'

// ── resolveEvent ───────────────────────────────────────────────────────────
export function resolveEvent(
  game: SaveGame,
  eventId: string,
  choiceId: string,
): SaveGame {
  const event = (game.pendingEvents ?? []).find(e => e.id === eventId)
  if (!event) return game

  const choice = event.choices.find(c => c.id === choiceId)
  if (!choice) return game

  // Handle sponsor events by type (not effect)
  if (event.type === 'sponsorOffer') {
    if (choiceId === 'accept' && event.sponsorData) {
      const sponsor: Sponsor = JSON.parse(event.sponsorData)
      return {
        ...game,
        pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
        sponsors: [...(game.sponsors ?? []), sponsor],
      }
    }
    return {
      ...game,
      pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
    }
  }

  const { effect } = choice
  let updatedGame = game

  switch (effect.type) {
    case 'acceptTransfer': {
      const bid = (game.transferBids ?? []).find(b => b.id === effect.bidId)
      if (bid) {
        updatedGame = executeTransfer(game, bid)
      }
      break
    }
    case 'rejectTransfer': {
      updatedGame = {
        ...updatedGame,
        transferBids: (updatedGame.transferBids ?? []).map(b =>
          b.id === effect.bidId ? { ...b, status: 'rejected' as const } : b,
        ),
        players: effect.targetPlayerId
          ? updatedGame.players.map(p =>
              p.id === effect.targetPlayerId
                ? { ...p, morale: Math.max(0, p.morale - 5) }
                : p,
            )
          : updatedGame.players,
      }
      break
    }
    case 'counterOffer': {
      const currentBid = (updatedGame.transferBids ?? []).find(b => b.id === effect.bidId)
      const currentCount = currentBid?.counterCount ?? 0
      if (currentCount >= 2) {
        // Third attempt — AI gives up
        updatedGame = {
          ...updatedGame,
          transferBids: (updatedGame.transferBids ?? []).map(b =>
            b.id === effect.bidId ? { ...b, status: 'rejected' as const } : b,
          ),
        }
      } else {
        updatedGame = {
          ...updatedGame,
          transferBids: (updatedGame.transferBids ?? []).map(b =>
            b.id === effect.bidId
              ? {
                  ...b,
                  offerAmount: effect.value ?? b.offerAmount,
                  expiresRound: b.expiresRound + 1,
                  counterCount: currentCount + 1,
                }
              : b,
          ),
        }
      }
      break
    }
    case 'extendContract': {
      const pid = effect.targetPlayerId
      if (pid) {
        const years = choice.id === 'extend3' ? 3 : 1
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === pid
              ? {
                  ...p,
                  contractUntilSeason: updatedGame.currentSeason + years,
                  salary: effect.value ?? p.salary,
                  morale: Math.min(100, p.morale + 10),
                }
              : p,
          ),
          handledContractPlayerIds: [...(updatedGame.handledContractPlayerIds ?? []), pid],
        }
      }
      break
    }
    case 'rejectContract': {
      const pid = effect.targetPlayerId
      if (pid) {
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === pid ? { ...p, morale: Math.max(0, p.morale - 10) } : p,
          ),
          handledContractPlayerIds: [...(updatedGame.handledContractPlayerIds ?? []), pid],
        }
      }
      break
    }
    case 'boostMorale': {
      const pid = effect.targetPlayerId
      if (pid) {
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === pid ? { ...p, morale: Math.min(100, p.morale + (effect.value ?? 5)) } : p,
          ),
        }
      }
      break
    }
    case 'teamBoostMorale': {
      const boost = effect.value ?? 5
      const clubId = effect.targetClubId
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          (!clubId || p.clubId === clubId)
            ? { ...p, morale: Math.min(100, Math.max(0, p.morale + boost)) }
            : p,
        ),
      }
      break
    }
    case 'acceptSponsor': {
      const rawData = effect.sponsorData ?? event.sponsorData
      if (rawData) {
        try {
          const sponsor = JSON.parse(rawData)
          if (sponsor.id) {
            updatedGame = {
              ...updatedGame,
              sponsors: [...(updatedGame.sponsors ?? []), sponsor],
              inbox: [...updatedGame.inbox, {
                id: `inbox_sponsor_${sponsor.id}`,
                date: updatedGame.currentDate,
                type: InboxItemType.BoardFeedback,
                title: `🤝 Nytt sponsoravtal: ${sponsor.name}`,
                body: `${sponsor.name} har tecknat avtal. +${sponsor.weeklyIncome} kr/omgång i ${sponsor.contractRounds} omgångar.`,
                isRead: false,
              }],
            }
          }
        } catch {}
      }
      break
    }
    case 'pressResponse': {
      const moraleBoost = effect.value ?? 0
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.clubId === updatedGame.managedClubId
            ? { ...p, morale: Math.max(0, Math.min(100, p.morale + moraleBoost)) }
            : p
        ),
      }
      // Update journalist memory
      if (updatedGame.journalist) {
        const matchday = updatedGame.fixtures
          .filter(f => f.status === 'completed' && !f.isCup)
          .reduce((max, f) => Math.max(max, f.roundNumber), 0)
        const isRefusal = choiceId === 'refuse_press'
        updatedGame = {
          ...updatedGame,
          journalist: isRefusal
            ? recordPressRefusal(updatedGame.journalist, updatedGame.currentSeason, matchday)
            : recordInteraction(updatedGame.journalist, updatedGame.currentSeason, matchday,
                moraleBoost > 0 ? 'good_answer' : 'bad_answer', moraleBoost > 0 ? 3 : -3),
          journalistRelationship: isRefusal
            ? Math.max(0, (updatedGame.journalistRelationship ?? 50) - 8)
            : (updatedGame.journalistRelationship ?? 50) + (moraleBoost > 0 ? 3 : -3),
        }
      }
      // Add media quote to inbox if present
      if (effect.mediaQuote) {
        const mediaInboxItem = {
          id: `inbox_press_${eventId}_${Date.now()}`,
          date: updatedGame.currentDate,
          type: InboxItemType.Media,
          title: effect.mediaQuote,
          body: '',
          isRead: false,
        }
        updatedGame = {
          ...updatedGame,
          inbox: [...updatedGame.inbox, mediaInboxItem],
        }
      }
      break
    }
    case 'makeFullTimePro': {
      const pid = effect.targetPlayerId
      if (pid) {
        const proPlayer = updatedGame.players.find(p => p.id === pid)
        const oldJob = proPlayer?.dayJob?.title ?? 'jobbet'
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === pid
              ? {
                  ...p,
                  isFullTimePro: true,
                  dayJob: undefined,
                  salary: effect.value ?? p.salary,
                  morale: Math.min(100, p.morale + 15),
                }
              : p
          ),
          storylines: [
            ...(updatedGame.storylines ?? []),
            {
              id: `story_pro_${pid}_${updatedGame.currentSeason}`,
              type: 'went_fulltime_pro' as const,
              season: updatedGame.currentSeason,
              matchday: updatedGame.fixtures.filter(f => f.status === 'completed' && !f.isCup).reduce((m, f) => Math.max(m, f.roundNumber), 0),
              playerId: pid,
              description: 'went_fulltime_pro',
              displayText: proPlayer
                ? `${proPlayer.firstName} ${proPlayer.lastName} slutade som ${oldJob} för att satsa heltid på bandyn`
                : 'Blev heltidsproffs',
              resolved: true,
            },
          ],
        }
      }
      break
    }
    case 'raiseBid': {
      updatedGame = {
        ...updatedGame,
        transferBids: (updatedGame.transferBids ?? []).map(b =>
          b.id === effect.bidId
            ? { ...b, offerAmount: effect.value ?? Math.round(b.offerAmount * 1.3 / 5000) * 5000, expiresRound: b.expiresRound + 1 }
            : b
        ),
      }
      break
    }
    case 'setCommunity': {
      if (!effect.communityKey) break
      const current: CommunityActivities = updatedGame.communityActivities ?? {
        kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false,
      }
      const val = effect.communityValue
      // Also apply money effect if amount is set
      if (effect.amount) {
        updatedGame = {
          ...updatedGame,
          clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.amount),
        }
      }
      if (effect.communityKey === 'kiosk') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), kiosk: val as 'none' | 'basic' | 'upgraded' } }
      } else if (effect.communityKey === 'lottery') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), lottery: val as 'none' | 'basic' | 'intensive' } }
      } else if (effect.communityKey === 'bandyplay') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), bandyplay: true } }
      } else if (effect.communityKey === 'functionaries') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), functionaries: true } }
      } else if (effect.communityKey === 'julmarknad') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), julmarknad: true } }
      }
      break
    }
    case 'patronHappiness': {
      // Update singular patron
      if (updatedGame.patron?.isActive) {
        const newHappiness = Math.max(0, Math.min(100, (updatedGame.patron.happiness ?? 50) + (effect.amount ?? 0)))
        const stillActive = newHappiness > 0
        updatedGame = {
          ...updatedGame,
          patron: { ...updatedGame.patron, happiness: newHappiness, isActive: stillActive },
        }
      }
      // Mecenat intro event: event_mecenat_intro_<id> — activate or remove the pending mecenat
      if (eventId.startsWith('event_mecenat_intro_') && updatedGame.mecenater?.length) {
        const mecenatId = eventId.replace('event_mecenat_intro_', '')
        const pendingMec = updatedGame.mecenater.find(m => m.id === mecenatId && !m.isActive)
        if (pendingMec) {
          const isDecline = (effect.amount ?? 0) === 0
          if (isDecline) {
            // Decline: remove the pending mecenat
            updatedGame = {
              ...updatedGame,
              mecenater: updatedGame.mecenater.filter(m => m.id !== mecenatId),
            }
          } else {
            // Welcome / cautious: activate with initial happiness
            const completedFixtures = (updatedGame.fixtures ?? []).filter(f => (f.status as string) === 'completed')
            const currentMatchday = completedFixtures.length > 0
              ? Math.max(...completedFixtures.map(f => f.matchday))
              : 0
            const initialHappiness = Math.min(100, 50 + (effect.amount ?? 0))
            updatedGame = {
              ...updatedGame,
              mecenater: updatedGame.mecenater.map(m =>
                m.id === mecenatId
                  ? { ...m, isActive: true, happiness: initialHappiness, lastInteractionRound: currentMatchday }
                  : m
              ),
            }
          }
        }
      }
      // Update matching active mecenat (events from social/silent shout contain mecenat ID)
      if (updatedGame.mecenater?.length && !eventId.startsWith('event_mecenat_intro_')) {
        const matchedMec = updatedGame.mecenater.find(m => m.isActive && eventId.includes(m.id))
        if (matchedMec) {
          const mNewHappiness = Math.max(0, Math.min(100, matchedMec.happiness + (effect.amount ?? 0)))
          const completedFixtures = (updatedGame.fixtures ?? []).filter(f => (f.status as string) === 'completed')
          const currentMatchday = completedFixtures.length > 0
            ? Math.max(...completedFixtures.map(f => f.matchday))
            : 0
          updatedGame = {
            ...updatedGame,
            mecenater: updatedGame.mecenater.map(m =>
              m.id === matchedMec.id
                ? { ...m, happiness: mNewHappiness, isActive: mNewHappiness > 0, lastInteractionRound: currentMatchday }
                : m
            ),
          }
        }
      }
      break
    }
    case 'politicianRelationship': {
      if (!updatedGame.localPolitician) break
      const newRel = Math.max(0, Math.min(100, (updatedGame.localPolitician.relationship ?? 50) + (effect.amount ?? 0)))
      updatedGame = {
        ...updatedGame,
        localPolitician: { ...updatedGame.localPolitician, relationship: newRel },
      }
      break
    }
    case 'kommunBidragChange': {
      if (!updatedGame.localPolitician) break
      const newBidrag = Math.max(0, (updatedGame.localPolitician.kommunBidrag ?? 0) + (effect.amount ?? 0))
      updatedGame = {
        ...updatedGame,
        localPolitician: { ...updatedGame.localPolitician, kommunBidrag: newBidrag },
      }
      break
    }
    case 'facilitiesUpgrade': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, facilities: Math.min(100, (c.facilities ?? 50) + (effect.amount ?? 5)) }
            : c
        ),
      }
      break
    }
    case 'kommunGamble': {
      updatedGame = {
        ...updatedGame,
        clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.amount ?? 0),
      }
      break
    }
    case 'tempFacilities': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, facilities: Math.max(0, Math.min(100, c.facilities + (effect.amount ?? 0) * 5)) }
            : c
        ),
      }
      break
    }
    case 'income': {
      updatedGame = {
        ...updatedGame,
        clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.amount ?? 0),
      }
      break
    }
    case 'reputation': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, reputation: Math.max(1, Math.min(100, c.reputation + (effect.amount ?? 0))) }
            : c
        ),
      }
      break
    }
    case 'fanMood': {
      updatedGame = {
        ...updatedGame,
        fanMood: Math.max(0, Math.min(100, (updatedGame.fanMood ?? 50) + (effect.amount ?? 0))),
      }
      break
    }
    case 'communityStanding': {
      updatedGame = {
        ...updatedGame,
        communityStanding: Math.max(0, Math.min(100, (updatedGame.communityStanding ?? 50) + (effect.amount ?? 0))),
      }
      break
    }
    case 'journalistRelationship': {
      updatedGame = {
        ...updatedGame,
        journalistRelationship: Math.max(0, Math.min(100, (updatedGame.journalistRelationship ?? 50) + (effect.amount ?? 0))),
      }
      break
    }
    case 'patronInfluence': {
      if (!updatedGame.patron) break
      updatedGame = {
        ...updatedGame,
        patron: {
          ...updatedGame.patron,
          influence: Math.max(0, Math.min(100, (updatedGame.patron.influence ?? 30) + (effect.amount ?? 0))),
          patience: Math.max(0, Math.min(100, (updatedGame.patron.patience ?? 80) + (effect.value ?? 0))),
        },
      }
      break
    }
    case 'mecenatHappiness': {
      if (effect.targetMecenatId && updatedGame.mecenater) {
        const delta = effect.amount ?? 0
        const costKr = effect.value ?? 0
        updatedGame = {
          ...updatedGame,
          mecenater: updatedGame.mecenater.map(m =>
            m.id === effect.targetMecenatId
              ? { ...m, happiness: Math.max(0, Math.min(100, m.happiness + delta)) }
              : m
          ),
        }
        if (costKr !== 0) {
          updatedGame = {
            ...updatedGame,
            clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, costKr),
          }
        }
      }
      break
    }
    case 'boardPatience': {
      updatedGame = {
        ...updatedGame,
        boardPatience: Math.max(0, Math.min(100, (updatedGame.boardPatience ?? 70) + (effect.amount ?? 0))),
      }
      break
    }
    case 'multiEffect': {
      // subEffects is a JSON array of EventEffect objects
      if (effect.subEffects) {
        try {
          const subList: Array<{ type: string; amount?: number; value?: number; targetPlayerId?: string }> = JSON.parse(effect.subEffects)
          for (const sub of subList) {
            if (sub.type === 'income') {
              updatedGame = {
                ...updatedGame,
                clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, sub.amount ?? 0),
              }
            } else if (sub.type === 'communityStanding') {
              updatedGame = {
                ...updatedGame,
                communityStanding: Math.max(0, Math.min(100, (updatedGame.communityStanding ?? 50) + (sub.amount ?? 0))),
              }
            } else if (sub.type === 'fanMood') {
              updatedGame = {
                ...updatedGame,
                fanMood: Math.max(0, Math.min(100, (updatedGame.fanMood ?? 50) + (sub.amount ?? 0))),
              }
            } else if (sub.type === 'journalistRelationship') {
              updatedGame = {
                ...updatedGame,
                journalistRelationship: Math.max(0, Math.min(100, (updatedGame.journalistRelationship ?? 50) + (sub.amount ?? 0))),
              }
            } else if (sub.type === 'boardPatience') {
              updatedGame = {
                ...updatedGame,
                boardPatience: Math.max(0, Math.min(100, (updatedGame.boardPatience ?? 70) + (sub.amount ?? 0))),
              }
            } else if (sub.type === 'politicianRelationship') {
              if (updatedGame.localPolitician) {
                updatedGame = {
                  ...updatedGame,
                  localPolitician: {
                    ...updatedGame.localPolitician,
                    relationship: Math.max(0, Math.min(100, (updatedGame.localPolitician.relationship ?? 50) + (sub.amount ?? 0))),
                  },
                }
              }
            } else if (sub.type === 'supporterMood') {
              if (updatedGame.supporterGroup) {
                updatedGame = {
                  ...updatedGame,
                  supporterGroup: {
                    ...updatedGame.supporterGroup,
                    mood: Math.max(0, Math.min(100, updatedGame.supporterGroup.mood + (sub.amount ?? 0))),
                  },
                }
              }
            } else if (sub.type === 'boostMorale' && sub.targetPlayerId) {
              updatedGame = {
                ...updatedGame,
                players: updatedGame.players.map(p =>
                  p.id === sub.targetPlayerId
                    ? { ...p, morale: Math.min(100, p.morale + (sub.amount ?? 5)) }
                    : p
                ),
              }
            } else if (sub.type === 'patronInfluence') {
              if (updatedGame.patron) {
                updatedGame = {
                  ...updatedGame,
                  patron: {
                    ...updatedGame.patron,
                    influence: Math.max(0, Math.min(100, (updatedGame.patron.influence ?? 30) + (sub.amount ?? 0))),
                  },
                }
              }
            }
          }
        } catch { /* ignore parse errors */ }
      }
      break
    }
    case 'supporterMood': {
      if (updatedGame.supporterGroup) {
        updatedGame = {
          ...updatedGame,
          supporterGroup: {
            ...updatedGame.supporterGroup,
            mood: Math.max(0, Math.min(100, updatedGame.supporterGroup.mood + (effect.amount ?? 0))),
          },
        }
      }
      break
    }
    case 'noOp':
      // Mecenat intro declined — remove the pending (inactive) mecenat from the array
      if (eventId.startsWith('event_mecenat_intro_') && updatedGame.mecenater?.length) {
        const mecenatId = eventId.replace('event_mecenat_intro_', '')
        updatedGame = {
          ...updatedGame,
          mecenater: updatedGame.mecenater.filter(m => !(m.id === mecenatId && !m.isActive)),
        }
      }
      break
    case 'openNegotiation':
    default:
      break
  }

  // Special: detOmojligaValet sell — remove player from squad
  if (event.type === 'detOmojligaValet' && choiceId === 'sell' && event.relatedPlayerId) {
    const pid = event.relatedPlayerId
    updatedGame = {
      ...updatedGame,
      players: updatedGame.players.map(p => p.id === pid ? { ...p, clubId: 'free_agent' } : p),
      clubs: updatedGame.clubs.map(c =>
        c.id === updatedGame.managedClubId
          ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== pid) }
          : c
      ),
      inbox: [...(updatedGame.inbox ?? []), {
        id: `inbox_sell_academyproduct_${pid}_${updatedGame.currentSeason}`,
        date: updatedGame.currentDate,
        type: InboxItemType.Media,
        title: 'Akademijuvel säljs',
        body: 'Klubben säljer sin akademiprodukt för att lösa den ekonomiska krisen. Lokaltidningen skriver kritiskt om beslutet.',
        isRead: false,
      }],
    }
  }

  // Special: supporterEvent tifo — mark tifoDone
  if (event.type === 'supporterEvent' && event.id.startsWith('supporter_tifo_') && choiceId !== 'no' && updatedGame.supporterGroup) {
    updatedGame = {
      ...updatedGame,
      supporterGroup: { ...updatedGame.supporterGroup, tifoDone: true },
    }
  }

  // Special: supporterEvent away_trip — mark awayTripSeason
  if (event.type === 'supporterEvent' && event.id.startsWith('supporter_away_trip_') && updatedGame.supporterGroup) {
    updatedGame = {
      ...updatedGame,
      supporterGroup: { ...updatedGame.supporterGroup, awayTripSeason: updatedGame.currentSeason },
    }
  }

  // Special: supporterEvent conflict — mark conflictSeason
  if (event.type === 'supporterEvent' && event.id.startsWith('supporter_conflict_') && updatedGame.supporterGroup) {
    updatedGame = {
      ...updatedGame,
      supporterGroup: { ...updatedGame.supporterGroup, conflictSeason: updatedGame.currentSeason },
    }
  }

  // Special: spoksponsor accept — add board member modernist
  if (event.type === 'spoksponsor' && choiceId === 'accept') {
    const newMember = { name: 'Okänd Investerare', role: 'ledamot' as const, personality: 'modernist' as const }
    updatedGame = {
      ...updatedGame,
      boardPersonalities: [...(updatedGame.boardPersonalities ?? []), newMember],
    }
  }

  // Special: icaMaxiEvent send_player — also add morale effect to random player
  if (event.type === 'icaMaxiEvent' && choiceId === 'send_player') {
    const managedPlayers = updatedGame.players.filter(p => p.clubId === updatedGame.managedClubId && !p.isInjured)
    if (managedPlayers.length > 0) {
      const chosen = managedPlayers[Math.floor(Math.random() * managedPlayers.length)]
      const moraleDelta = (chosen.discipline ?? 50) > 60 ? 5 : -3
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.id === chosen.id ? { ...p, morale: Math.max(0, Math.min(100, p.morale + moraleDelta)) } : p
        ),
      }
    }
  }

  // Special: school conflict — affect youth player confidence
  if (eventId.startsWith('event_school_conflict_') && updatedGame.youthTeam && event.relatedPlayerId) {
    const youthPlayerId = event.relatedPlayerId
    const confidenceDelta = choiceId === 'let_study' ? 8 : -8
    updatedGame = {
      ...updatedGame,
      youthTeam: {
        ...updatedGame.youthTeam,
        players: updatedGame.youthTeam.players.map(p =>
          p.id === youthPlayerId
            ? { ...p, confidence: Math.max(0, Math.min(100, p.confidence + confidenceDelta)) }
            : p
        ),
      },
    }
  }

  // Special: district callup — affect confidence + development of high-potential youth players
  if (eventId.startsWith('event_district_callup_') && updatedGame.youthTeam) {
    const candidates = updatedGame.youthTeam.players.filter(p => p.potentialAbility > 50)
    if (candidates.length > 0) {
      const confidenceDelta = choiceId === 'send' ? 15 : -5
      const devDelta = choiceId === 'send' ? 2 : 0
      updatedGame = {
        ...updatedGame,
        youthTeam: {
          ...updatedGame.youthTeam,
          players: updatedGame.youthTeam.players.map(p =>
            candidates.some(c => c.id === p.id)
              ? {
                  ...p,
                  confidence: Math.max(0, Math.min(100, p.confidence + confidenceDelta)),
                  developmentRate: Math.min(100, p.developmentRate + devDelta),
                }
              : p
          ),
        },
      }
    }
  }

  // If this was a hall debate event, increment counters
  if (eventId.startsWith('hall_')) {
    const lastFixtureRound = updatedGame.lastCompletedFixtureId
      ? (updatedGame.fixtures.find(f => f.id === updatedGame.lastCompletedFixtureId)?.roundNumber ?? 0)
      : 0
    updatedGame = {
      ...updatedGame,
      hallDebateCount: (updatedGame.hallDebateCount ?? 0) + 1,
      lastHallDebateRound: lastFixtureRound,
    }
  }

  // Mark event resolved and remove from pendingEvents
  updatedGame = {
    ...updatedGame,
    pendingEvents: (updatedGame.pendingEvents ?? []).filter(e => e.id !== eventId),
    resolvedEventIds: [...(updatedGame.resolvedEventIds ?? []), eventId].slice(-200), // keep last 200
  }

  // ── Post-resolution storyline generation ────────────────────────────────
  const currentMatchday = updatedGame.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((m, f) => Math.max(m, f.roundNumber), 0)

  if (event.type === 'captainSpeech') {
    updatedGame = {
      ...updatedGame,
      storylines: [
        ...(updatedGame.storylines ?? []),
        {
          id: `story_captain_${updatedGame.currentSeason}`,
          type: 'captain_rallied_team' as const,
          season: updatedGame.currentSeason,
          matchday: currentMatchday,
          description: 'captain_rallied_team',
          displayText: 'Kaptenen samlade laget efter en svår period',
          resolved: true,
        },
      ],
    }
  }

  if (event.type === 'varsel' && choiceId === 'offer_pro') {
    updatedGame = {
      ...updatedGame,
      storylines: [
        ...(updatedGame.storylines ?? []),
        {
          id: `story_varsel_rescue_${updatedGame.currentSeason}`,
          type: 'rescued_from_unemployment' as const,
          season: updatedGame.currentSeason,
          matchday: currentMatchday,
          description: 'rescued_from_unemployment',
          displayText: 'Klubben räddade spelare från uppsägning genom att erbjuda heltidskontrakt',
          resolved: true,
        },
      ],
    }
  }

  // ── Create follow-up if event has followUpText ──────────────────────────
  if (event.followUpText) {
    const followUp = {
      id: `fu_${eventId}_${choiceId}`,
      triggerEventId: eventId,
      matchdaysDelay: 3 + Math.floor(Math.random() * 3), // 3-5 matchdays
      createdMatchday: currentMatchday,
      type: 'simple_inbox',
      data: { text: event.followUpText } as Record<string, unknown>,
    }
    updatedGame = {
      ...updatedGame,
      pendingFollowUps: [...(updatedGame.pendingFollowUps ?? []), followUp],
    }
  }

  // ── Record arc decisions ──────────────────────────────────────────────────
  if (event.type === 'playerArc') {
    updatedGame = {
      ...updatedGame,
      activeArcs: (updatedGame.activeArcs ?? []).map(arc =>
        arc.eventsFired.includes(eventId)
          ? { ...arc, decisionsMade: [...arc.decisionsMade, choiceId] }
          : arc
      ),
    }
  }

  return updatedGame
}
