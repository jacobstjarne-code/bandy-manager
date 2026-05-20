export type WatchOthersContext = 'lost_to_finalist' | 'lost_to_other' | 'never_in_playoff'

interface WatchOthersReflection {
  label: string
  reflection: string
}

export const WATCH_OTHERS_TEXT: Record<WatchOthersContext, WatchOthersReflection[]> = {
  lost_to_finalist: [
    {
      label: 'De vi förlorade mot',
      reflection: 'Laget som slog ut oss är fortfarande med. Kvar att se om de går hela vägen.',
    },
    {
      label: 'Slutspelet pågår',
      reflection: 'Vi slog mot laget som nu kan gå till final. Det gör ont och ger hopp på samma gång.',
    },
    {
      label: 'Fortsatt slutspel',
      reflection: 'Laget vi föll mot spelar vidare. Hur långt de går säger något om säsongen.',
    },
  ],
  lost_to_other: [
    {
      label: 'Slutspelet rullar',
      reflection: 'Laget som slog ut oss är borta nu också. Kvar är de starkaste — det var de inte mot oss.',
    },
    {
      label: 'Slutspelet',
      reflection: 'Vi är ute. Slutspelet avgörs utan oss. Intressant ändå att följa.',
    },
    {
      label: 'Andras kamp',
      reflection: 'Matcher kvar att spela. Vi tittar på som alla andra nu.',
    },
  ],
  never_in_playoff: [
    {
      label: 'Slutspelet',
      reflection: 'Vi var inte med i år. Bra tillfälle att studera vad de bättre lagen gör.',
    },
    {
      label: 'Titta och lära',
      reflection: 'Slutspelet är igång utan oss. Nästa år ska det se annorlunda ut.',
    },
    {
      label: 'Playoff pågår',
      reflection: 'Åtta lag kvar i vår värld — vi är inte ett av dem. Det förändras.',
    },
  ],
}
