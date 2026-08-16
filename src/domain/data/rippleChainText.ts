// ÖVERLÄMNING 2 steg 3 (2026-08-16): Jacobs text, klistrad ordagrant — Code
// skriver aldrig svensk speltext (CLAUDE.md). En rad per fält × riktning ×
// magnitude. Bara kombinationer som faktiskt kan uppstå idag har text (t.ex.
// "Orten upp" finns ingen trigger för ännu — ingen rad, inte en gissning).
import type { RippleChainStep } from '../entities/SaveGame'

interface RippleTextTiers {
  knappt: string
  tydligt: string
  kraftigt: string
}

const RIPPLE_STEP_TEXT: Partial<Record<string, RippleTextTiers>> = {
  Stämningen_down: {
    knappt: 'Lite tystare på läktaren nästa gång.',
    tydligt: 'Stämningen sjönk. Det märks på söndag.',
    kraftigt: 'Stämningen är i botten. Folk pratar om annat än bandy.',
  },
  Stämningen_up: {
    knappt: 'Någon nynnade på vägen ut.',
    tydligt: 'Stämningen lyfte. Det syns i biljettkön.',
    kraftigt: 'Hela orten går och ler. Det händer inte varje år.',
  },
  Klacken_down: {
    knappt: 'Klacken sjöng lite kortare än vanligt.',
    tydligt: 'Klacken är sur. Det hörs på vad de inte sjunger.',
    kraftigt: 'Klacken vände ryggen till. Bokstavligt, i andra halvlek.',
  },
  Klacken_up: {
    knappt: 'Klacken höll i sig en vers till.',
    tydligt: 'Klacken tog i. Trumman gick hela matchen.',
    kraftigt: 'Klacken stod kvar en halvtimme efter slutsignalen.',
  },
  Orten_down: {
    knappt: 'Någon på Konsum frågade hur det går.',
    tydligt: 'Orten pratar om klubben, och inte på det bra sättet.',
    kraftigt: 'Folk säger att det var bättre förr. Den här gången menar de det.',
  },
  Styrelsen_down: {
    knappt: 'Styrelsen noterade det. Inget mer.',
    tydligt: 'Styrelsen är inte nöjd. Det kommer ett samtal.',
    kraftigt: 'Styrelsen har tappat tålamodet. Räkna med en fråga om din framtid.',
  },
  Sponsorerna_up: {
    knappt: 'En sponsor hörde av sig utan att bli uppringd.',
    tydligt: 'Sponsorerna är på gott humör. Det märks i nästa förhandling.',
    kraftigt: 'Telefonen går varm. Alla vill sitta i logen nu.',
  },
  Kassan_up: {
    knappt: 'Lite mer i kassan. Det räcker till bandagen.',
    tydligt: 'Kassan andas. Det går att planera igen.',
    kraftigt: 'Kassan är full. Nu är det du som väljer.',
  },
  Kassan_down: {
    knappt: 'Lite mindre i kassan. Ingen märker det än.',
    tydligt: 'Kassan tunnades ut. Det syns i nästa budget.',
    kraftigt: 'Kassan är skrapad. Nu handlar det om vad som måste bort.',
  },
  Transferbudget_down: {
    knappt: 'Transferbudgeten krympte något.',
    tydligt: 'Transferbudgeten är tunn nu. Nästa värvning får vänta.',
    kraftigt: 'Transferbudgeten är slut. Det som finns i truppen är det som finns.',
  },
  Moralen_down: {
    knappt: 'Han ryckte på axlarna. Kanske inget.',
    tydligt: 'Han tog det illa. Det syns på träningen.',
    kraftigt: 'Han är förbannad. Det där kommer att märkas ett tag.',
  },
}

/** Slår upp textraden för ett ripple-steg. undefined om fält×riktning saknar text ännu (ej reachable idag). */
export function getRippleStepText(step: RippleChainStep): string | undefined {
  return RIPPLE_STEP_TEXT[`${step.label}_${step.dir}`]?.[step.magnitude]
}
