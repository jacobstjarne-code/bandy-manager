import type { Mecenat } from '../entities/Mecenat'
import type { GameEvent } from '../entities/GameEvent'
import type { SaveGame } from '../entities/SaveGame'

export interface DinnerOption {
  id: string
  label: string
  effect: {
    happiness: number
    communityStanding: number
    relationship: number
    financial?: number
  }
  followUp: string
}

export interface DinnerQuestion {
  id: string
  text: string
  options: DinnerOption[]
}

export interface DinnerScene {
  mecenatId: string
  mecenatName: string
  setting: 'jakt' | 'bastu' | 'whisky'
  settingDescription: string
  questions: DinnerQuestion[]
}

function getSetting(mec: Mecenat): 'jakt' | 'bastu' | 'whisky' {
  if (mec.businessType === 'brukspatron' || mec.businessType === 'skogsägare' || mec.businessType === 'jordbrukare') return 'jakt'
  if (mec.businessType === 'entrepreneur' || mec.businessType === 'it_miljonär') return 'whisky'
  return 'bastu'
}

function getSettingDescription(setting: 'jakt' | 'bastu' | 'whisky', mec: Mecenat): string {
  if (setting === 'jakt') {
    return `Dimman ligger låg över Stormyren. Geväret på axeln, hunden framför. ${mec.name} stannar vid en kulle och häller upp kaffe ur termosen.`
  }
  if (setting === 'whisky') {
    return `Biblioteket i ${mec.name}s hus. Brasan sprakar. En flaska Lagavulin 16 på bordet. "Jag har funderat", säger hen.`
  }
  return `Ångan ligger tung. Björkris hänger på kroken. ${mec.name} lutar sig mot bastuväggen och blundar. "Kan vi prata om nästa säsong?"`
}

export function generateDinnerScene(mec: Mecenat, _season: number): DinnerScene {
  const setting = getSetting(mec)
  const settingDescription = getSettingDescription(setting, mec)
  const name = mec.name

  const questions: DinnerQuestion[] = [
    {
      id: 'q0',
      text: `"Hur trivs du egentligen i den här orten?" frågar ${name} och ser dig rakt i ögonen.`,
      options: [
        {
          id: 'q0_opt0',
          label: 'Det är klart att jag trivs — det är en bra plats för bandy.',
          effect: { happiness: 4, communityStanding: 2, relationship: 2 },
          followUp: `${name} nickar. "Det syns på dig. Bra." En paus. Ni går vidare.`,
        },
        {
          id: 'q0_opt1',
          label: 'Det är en annorlunda plats. Jag fokuserar på jobbet.',
          effect: { happiness: 1, communityStanding: 0, relationship: -1 },
          followUp: `${name} hummar. "Ärlig sak." Hen verkar lite besviken men låter det bero.`,
        },
      ],
    },
    {
      id: 'q1',
      text: `"Jag funderar faktiskt på att bidra till nya omklädningsrum nästa år", säger ${name}. "Men jag vill veta att ni menar allvar med satsningen."`,
      options: [
        {
          id: 'q1_opt0',
          label: 'Vi menar allvar. Det behövs för att ta nästa steg.',
          effect: { happiness: 6, communityStanding: 3, relationship: 4, financial: 15000 },
          followUp: `${name} ler för första gången på kvällen. "Bra. Då pratar vi vidare." Hen pekar på glaset — en skål, sedan tystnad.`,
        },
        {
          id: 'q1_opt1',
          label: 'Det är ett stort beslut — låt oss se hur säsongen slutar.',
          effect: { happiness: 2, communityStanding: 1, relationship: 1 },
          followUp: `${name} nickar långsamt. "Försiktig. Det gillar jag." Men entusiasmen svalnar något.`,
        },
      ],
    },
    {
      id: 'q2',
      text: `"Jag hörde att det finns intresse för ${name.split(' ')[0]}s pengar från andra håll i kommunen. Du vet vad jag menar?" ${name} lägger ner glaset.`,
      options: [
        {
          id: 'q2_opt0',
          label: 'Du är den viktigaste personen för den här föreningen. Det vet du.',
          effect: { happiness: 8, communityStanding: 1, relationship: 5 },
          followUp: `${name} sitter tyst en stund. Sedan: "Bra att höra." Det räckte.`,
        },
        {
          id: 'q2_opt1',
          label: 'Konkurrensen är sund — det stärker engagemanget i orten.',
          effect: { happiness: -3, communityStanding: 2, relationship: -3 },
          followUp: `${name} drar undan blicken. "Kanske." Kvällen slutar lite snabbare än planerat.`,
        },
      ],
    },
  ]

  return {
    mecenatId: mec.id,
    mecenatName: mec.name,
    setting,
    settingDescription,
    questions,
  }
}

export function generateDinnerEvent(
  game: SaveGame,
  _nextMatchday: number,
): GameEvent | null {
  const activeMecenater = (game.mecenater ?? []).filter(m => m.isActive && m.happiness >= 40)
  if (activeMecenater.length === 0) return null

  // Only once per season
  const alreadyThisSeason = (game.pendingEvents ?? []).some(
    e => e.type === 'mecenatDinner',
  )
  if (alreadyThisSeason) return null

  // Check resolved events this season — use a flag in resolvedEventIds if available
  const resolvedThisSeason = (game.resolvedEventIds ?? []).some(
    id => id.startsWith(`event_mec_dinner_${game.currentSeason}_`),
  )
  if (resolvedThisSeason) return null

  const mec = activeMecenater[0]
  const scene = generateDinnerScene(mec, game.currentSeason)
  const eventId = `event_mec_dinner_${game.currentSeason}_${mec.id}`

  return {
    id: eventId,
    type: 'mecenatDinner',
    title: `Middag med ${mec.name}`,
    body: scene.settingDescription,
    sponsorData: JSON.stringify(scene),
    sender: { name: mec.name, role: mec.business },
    choices: [
      {
        id: 'start',
        label: 'Sätt dig ner',
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
    priority: 'high',
  }
}
