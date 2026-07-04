import type { SeasonSignatureId } from '../../entities/SeasonSignature'

export interface SignatureRevealData {
  emoji: string
  title: string
  subtitle: string
  body: string
  ctaText: string
}

export const SIGNATURE_REVEAL_DATA: Record<SeasonSignatureId, SignatureRevealData> = {
  calm_season: {
    emoji: '',
    title: '',
    subtitle: '',
    body: '',
    ctaText: '',
  }, // visas inte som scen
  cold_winter: {
    emoji: '🌨',
    title: 'KÖLDVINTERN',
    subtitle: 'Vintern ser ut att bli kallare än vanligt.',
    body: 'Långtidsprognosen pekar på minusgrader långt in i mars. Veckor av tjugo minus är att vänta. Klubbarna har redan beställt fler klubbor.',
    ctaText: 'Då kör vi',
  },
  scandal_season: {
    emoji: '📰',
    title: 'SKANDALSÄSONGEN',
    subtitle: 'Förbundet är skakat innan säsongen börjat.',
    body: 'Flera klubbar har redan haft offentliga gräl i sommar. Lokaltidningarna kommer skriva om allt utom bandyn.',
    ctaText: 'Vi håller oss utanför',
  },
  hot_transfer_market: {
    emoji: '💼',
    title: 'HET TRANSFERMARKNAD',
    subtitle: 'Pengarna har börjat flöda i serien.',
    body: 'Sponsorer har sökt sig till bandyn och plötsligt finns det budgetar att räkna med. Telefonen kommer ringa. Fönstret kommer stänga med dramatik.',
    ctaText: 'Sätt en plan',
  },
  injury_curve: {
    emoji: '🩹',
    title: 'SKADEKURVAN',
    subtitle: 'Mellansäsongens skadeperiod blir tuff.',
    body: 'Sjukgymnasterna varnar redan för veckorna kring jul — den här vintern lär slita på kropparna. Akademin behöver kliva fram.',
    ctaText: 'Förbered laget',
  },
  dream_round: {
    emoji: '✨',
    title: 'DRÖMRUNDAN',
    subtitle: 'Småklubbarna spelar över sin förmåga.',
    body: 'Något har hänt i bandyn. Underdogs vinner. Storlagen tappar oväntat. Det här är säsongen där allt kan hända — också för er.',
    ctaText: 'Vi tar vår chans',
  },
}
