export type SpectatorFocusType = 'kontrakt' | 'akademi' | 'trupp'

interface SpectatorFocusVariant {
  headline: string
  body: string
  cta: string
}

/**
 * Pools per kontextuell fokus (inte cyklisk). Picker väljer fokus
 * baserat på vilket som är viktigast just nu — kontrakt som löper ut,
 * akademitalanger redo, eller default trupp-arbete.
 *
 * Tonregel (spec 0.5): koppla till varför det spelar roll NU.
 * "Tre kontrakt löper ut" — inte bara "Kontrakt".
 */
export const SPECTATOR_PRIMARY_TEXT: Record<SpectatorFocusType, SpectatorFocusVariant[]> = {
  kontrakt: [
    {
      headline: 'Kontrakt går ut i vår',
      body: '{count} spelare har kontrakt som löper ut i april. Det är nu samtalen kan tas — innan andra ringer.',
      cta: 'Trupp →',
    },
    {
      headline: 'Spelarna väntar',
      body: '{count} kontrakt på bordet. De vet att vi har tid nu när slutspelet rullar utan oss.',
      cta: 'Trupp →',
    },
    {
      headline: 'Innan transferfönstret',
      body: '{count} utgående kontrakt. Bättre prata medan tystnaden är vår än när januari kommer.',
      cta: 'Trupp →',
    },
    {
      headline: 'Tid att förhandla',
      body: '{count} kontrakt att förlänga eller släppa. Slutspelet ger oss veckor som annars inte fanns.',
      cta: 'Trupp →',
    },
  ],
  akademi: [
    {
      headline: 'Akademin är redo',
      body: '{count} ungdomar närmar sig A-truppen. Nu finns tiden att granska dem ordentligt.',
      cta: 'Akademi →',
    },
    {
      headline: 'Talangerna stiger',
      body: '{count} i P19 står på tröskeln. Inte alla ska upp — det är vårt val.',
      cta: 'Akademi →',
    },
    {
      headline: 'Akademibesök',
      body: '{count} talanger börjar bli mogna. Bra läge att gå dit och titta själv.',
      cta: 'Akademi →',
    },
    {
      headline: 'Ungdomsledaren vill ha besked',
      body: '{count} unga som kan kliva upp till nästa säsong. Beslutet kommer ändå.',
      cta: 'Akademi →',
    },
  ],
  trupp: [
    {
      headline: 'Truppen finns kvar',
      body: 'Slutspelet är inte vårt. Bra läge att gå genom laget. Vad är vi om ett år?',
      cta: 'Trupp →',
    },
    {
      headline: 'Utvecklingssamtal',
      body: 'Andra spelar slutspel. Vi sätter oss ner med spelarna. Det görs sällan i januari.',
      cta: 'Trupp →',
    },
    {
      headline: 'Tid att tänka',
      body: 'Slutspelet rullar utan oss. Det är då de bättre besluten brukar tas — när bruset är borta.',
      cta: 'Trupp →',
    },
    {
      headline: 'Truppen inför nästa år',
      body: 'Vad ska den här truppen vara nästa säsong? Den frågan har inte ställts ordentligt på ett tag.',
      cta: 'Trupp →',
    },
  ],
}
