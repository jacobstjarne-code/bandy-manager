import type { RefereeStyle, RefereePersonality } from '../entities/Referee'

// ── Kurerad domarpool ──────────────────────────────────────────────────────────
//
// 8 fiktiva huvuddomare som speglar svensk bandy 2026. Blandad demografi:
// äldre herrar från bandy-Sverige, en kvinnlig domare (Elitserien har
// kvinnliga huvuddomare sedan Hannah Pettersson 2024 — fortfarande ovanligt),
// olika regioner, olika år i sporten.
//
// Styles (interna kategorier, visas inte som text):
//   strict — tydlig, konsekvent, noterar allt
//   lenient — låter spelet löpa, sparsamma utvisningar
//   inconsistent — svårläst, kan ändra tempo mellan halvlekarna
//
// Personality flaggar spelsammanhang (derby-specialist används i commentary).

export interface RefereeProfile {
  firstName: string
  lastName: string
  homeTown: string
  yearsOfExperience: number
  style: RefereeStyle
  personality: RefereePersonality
  quirk: string       // en rad, visas under domarens namn i meeting-kortet
  backstory: string   // två meningar, visas i utökad bio vid domarmötet
}

export const REFEREE_PROFILES: RefereeProfile[] = [
  {
    firstName: 'Ove',
    lastName: 'Hansson',
    homeTown: 'Gävle',
    yearsOfExperience: 22,
    style: 'strict',
    personality: 'veteran',
    quirk: 'Pratar helst efter matchen, inte under.',
    backstory: 'Började döma i Gävlesektionen 2003, tog steget till Elitserien 2011. Sitter i Regel- och Domarkommittén sedan tre år — vilket spelarna brukar märka först när de protesterar.',
  },
  {
    firstName: 'Hanna',
    lastName: 'Ekström',
    homeTown: 'Sandviken',
    yearsOfExperience: 8,
    style: 'strict',
    personality: 'neutral',
    quirk: 'Har notera-block i västen. Räknar högt.',
    backstory: 'Kom till bandyn via ishockeydömning i Bollnäs. Var med i den första kullen kvinnliga huvuddomare i herrarnas Elitserie och har hållit sig kvar sedan dess — genom att inte göra affär av det.',
  },
  {
    firstName: 'Tommy',
    lastName: 'Bäckström',
    homeTown: 'Arvika',
    yearsOfExperience: 5,
    style: 'lenient',
    personality: 'rookie',
    quirk: 'Jobbar på Coop dagtid. Delar ut äpplen i omklädningsrummet.',
    backstory: 'Gick förbundsdomarkursen 2021 efter att ha dömt ungdomsbandy i tio år. Fick Elitseriematcher förra säsongen, fortfarande lite yr av det.',
  },
  {
    firstName: 'Rolf',
    lastName: 'Sundqvist',
    homeTown: 'Kalix',
    yearsOfExperience: 14,
    style: 'inconsistent',
    personality: 'controversial',
    quirk: 'Förklarar gärna sina beslut. Länge.',
    backstory: 'Har dömt i Norrland sedan mitten av tiotalet, i Elitserien sedan 2019. Kände sig förbigången när han inte kom med i situationsgruppen — det märks ibland.',
  },
  {
    firstName: 'Lars-Inge',
    lastName: 'Pettersson',
    homeTown: 'Edsbyn',
    yearsOfExperience: 18,
    style: 'lenient',
    personality: 'derby-specialist',
    quirk: 'Vet namnen på Edsbyn-ledarnas barn.',
    backstory: 'Växte upp vid Svedmyra och har dömt varenda Edsbyn-Bollnäs sedan 2012. Slutade spela i Division 1 och gick direkt över till domare — det fanns fler luckor där.',
  },
  {
    firstName: 'Kent',
    lastName: 'Wallin',
    homeTown: 'Nässjö',
    yearsOfExperience: 11,
    style: 'lenient',
    personality: 'neutral',
    quirk: 'Svarar alltid i telefon. Även under matcher.',
    backstory: 'Gick från ungdomsdömning till Allsvenskan på fyra år, tog Elitseriematcher från 2017. Sköter sin egen redovisningsfirma vid sidan av — båda jobben är lika mycket uppringning och stämningsläge.',
  },
  {
    firstName: 'Gunnar',
    lastName: 'Rönnqvist',
    homeTown: 'Boliden',
    yearsOfExperience: 26,
    style: 'strict',
    personality: 'veteran',
    quirk: 'Sista säsongen. Har sagt det i tre år.',
    backstory: 'Dömde sin första SM-final 2009 och har gjort det fem gånger till. Hade talan i domarskandalen 2022 och mindes allt i utredningen — det har inte glömts bort i kåren.',
  },
  {
    firstName: 'Patrik',
    lastName: 'Öberg',
    homeTown: 'Uppsala',
    yearsOfExperience: 7,
    style: 'inconsistent',
    personality: 'neutral',
    quirk: 'Dömer hårdare när det är under −15. Märkbart.',
    backstory: 'Kom in sent — började efter en ryggskada som 32-åring avslutade spelarkarriären i Danmarks IF. Kroppen minns det fortfarande, vilket syns när han rör sig på stora planer i kyla.',
  },
]
