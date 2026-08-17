import type { Tavlingstyp, Skede } from './matchTypeAxes'

/**
 * GRANSKA CRESCENDO — post 6/7/10 (2026-08-17). KapitelPunkt: EN komponent,
 * fem innehåll — markerar i stället för att ceremoniera (rapportens röst,
 * inte ceremonins). Text från Opus, låst — se getKapitelPunktText, ändra
 * aldrig ordalydelsen här.
 *
 * Avsked är ETT av innehållen, inte en egen gren som river sektioner —
 * kommentarblocket i GranskaOversikt.tsx (rad ~375-387) dokumenterar varför
 * ett tidigare avgreningsförsök reverterades.
 */
export type KapitelPunktKind = 'sm_guld' | 'cup_vunnen' | 'sm_final_forlorad' | 'cupfinal_forlorad' | 'avsked'

export interface KapitelPunktAvskedData {
  firstName: string
  lastName: string
  games: number
  goals: number
}

export interface KapitelPunktText {
  title: string
  subtitle: string
}

const FIXED_COPY: Record<Exclude<KapitelPunktKind, 'avsked'>, KapitelPunktText> = {
  sm_guld: { title: 'Svenska mästare.', subtitle: 'Det står i protokollet nu. Det går inte att ta ifrån er.' },
  cup_vunnen: { title: 'Cupen är er.', subtitle: 'Pokalen åker med bussen hem.' },
  sm_final_forlorad: { title: 'Silver.', subtitle: 'Det tar ett tag innan man ser det som något annat.' },
  cupfinal_forlorad: { title: 'Final och förlust.', subtitle: 'Ni var där. Nästa gång vet ni hur det känns.' },
}

/** Vilken kapitelpunkt-variant en avslutad match motsvarar — eller null om ingen gäller. */
export function deriveKapitelPunktKind(
  tavlingstyp: Tavlingstyp,
  skede: Skede | undefined,
  won: boolean,
  isFarewell: boolean,
): KapitelPunktKind | null {
  if (isFarewell) return 'avsked'
  if (skede !== 'final') return null
  if (tavlingstyp === 'slutspel') return won ? 'sm_guld' : 'sm_final_forlorad'
  if (tavlingstyp === 'cup') return won ? 'cup_vunnen' : 'cupfinal_forlorad'
  return null
}

export function getKapitelPunktText(kind: KapitelPunktKind, avsked?: KapitelPunktAvskedData): KapitelPunktText | null {
  if (kind === 'avsked') {
    if (!avsked) return null
    const title = `${avsked.firstName} ${avsked.lastName} spelade sin sista match.`
    // Under tio mål: satsen om målen byts mot en om tjänstgöringstiden — en
    // låg målsiffra (back/målvakt) ska inte vara den siffra som lyfts fram.
    const subtitle = avsked.goals < 10
      ? `${avsked.games} matcher för samma klubb. Det är inte många som gör det.`
      : `${avsked.games} matcher, ${avsked.goals} mål. Han går av isen för egen maskin, och alla reser sig.`
    return { title, subtitle }
  }
  return FIXED_COPY[kind]
}
