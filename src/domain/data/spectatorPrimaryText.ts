export type SpectatorFocusType = 'kontrakt' | 'akademi' | 'trupp'

interface SpectatorFocusVariant {
  headline: string
  body: string
  cta: string
}

export const SPECTATOR_PRIMARY_TEXT: Record<SpectatorFocusType, SpectatorFocusVariant[]> = {
  kontrakt: [
    {
      headline: 'Kontrakt att förnya',
      body: '{count} spelare har kontrakt som löper ut i vår. Det är nu det avgörs om de stannar.',
      cta: 'Trupp →',
    },
    {
      headline: 'Kontraktsläget',
      body: '{count} spelare med utgående kontrakt. Passa på nu när det är lugnt.',
      cta: 'Trupp →',
    },
    {
      headline: 'Säkra truppen',
      body: '{count} kontrakt går ut. Börja samtalen medan säsongen fortfarande är färsk.',
      cta: 'Trupp →',
    },
    {
      headline: 'Löpsedeln nästa år börjar skrivas nu',
      body: '{count} spelare utan kontrakt nästa säsong om inget görs.',
      cta: 'Trupp →',
    },
  ],
  akademi: [
    {
      headline: 'Akademin är redo',
      body: '{count} ungt talent{plural} väntar på beskedet. Promotion eller inte?',
      cta: 'Akademi →',
    },
    {
      headline: 'Nästa generation',
      body: '{count} spelare i akademin är redo att ta steget upp. Välj med omsorg.',
      cta: 'Akademi →',
    },
    {
      headline: 'Akademitalanger',
      body: '{count} unga är redo för A-laget. Det är en möjlighet och ett ansvar.',
      cta: 'Akademi →',
    },
    {
      headline: 'Framtidens trupp',
      body: '{count} talang{plural} nära promotion. Säsongen är ett bra tillfälle att titta.',
      cta: 'Akademi →',
    },
  ],
  trupp: [
    {
      headline: 'Truppen',
      body: 'Ingen akut brandsläckning just nu. Titta igenom laget — vad behöver vi egentligen?',
      cta: 'Trupp →',
    },
    {
      headline: 'Dags att utvärdera',
      body: 'Slutspelet pågår utan oss. Bra läge att titta på truppen med friska ögon.',
      cta: 'Trupp →',
    },
    {
      headline: 'Truppen inför nästa år',
      body: 'Andra spelar slutspel. Vi planerar. Vad ska vara annorlunda nästa säsong?',
      cta: 'Trupp →',
    },
    {
      headline: 'Vilande men inte stilla',
      body: 'Inga matcher på schemat, men truppen behöver din uppmärksamhet ändå.',
      cta: 'Trupp →',
    },
  ],
}
