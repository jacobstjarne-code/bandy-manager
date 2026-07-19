/**
 * Kafferummet — Stures sex frågor (A3, Fable 2026-07-19).
 *
 * D1 (A1, Design): Sture vänder sig till spelaren som tredje beaten i ett
 * samtal man redan tjuvlyssnar på. Default-röst — den etablerade.
 * D2: svaret är två kursiva repliker i spelarens röst, ingen mekanisk effekt.
 * D3: konsekvensen är att svaret citeras tillbaka en senare omgång —
 * återkomsten (en tvåreplikersväxel Sture/Magnus) ligger i `returns`.
 *
 * Regler (A3, obligatoriska för A2):
 * - En fråga per besök, en besvarad fråga ställs aldrig igen (pensioneras).
 * - När alla sex är besvarade ställs inga fler — ingen krasch på tom pool.
 * - Bekräftelse-CTA är "Säg det →" för samtliga (ingen svarsspecifik CTA).
 */

export const COFFEE_ROOM_QUESTION_SPEAKER = 'Sture'

export interface CoffeeRoomAnswerOption {
  id: 'A' | 'B'
  text: string
}

export interface CoffeeRoomQuestionDef {
  id: string
  question: string
  answers: [CoffeeRoomAnswerOption, CoffeeRoomAnswerOption]
  /** Återkomstväxel per svar — [talareA, replikA, talareB, replikB], samma format som coffeeRoomService.ts:s exchanges. */
  returns: Record<'A' | 'B', [string, string, string, string]>
}

export const COFFEE_ROOM_QUESTIONS: CoffeeRoomQuestionDef[] = [
  {
    id: 'ungdomen',
    question: 'Vi har ett par grabbar i P19 som ser ut att kunna nåt. Andra klubbar köper färdigt. Du då?',
    answers: [
      { id: 'A', text: 'De egna får spela. Det är väl därför vi finns.' },
      { id: 'B', text: 'Jag tar den som är bäst på tisdag. Ålder är ingen merit.' },
    ],
    returns: {
      A: ['Sture', 'Han sa att de egna ska spela. Jag har hört det förr.', 'Magnus', 'Skillnaden är att den här verkar mena det.'],
      B: ['Magnus', 'Han bryr sig inte om var de kommer ifrån, sa han.', 'Sture', 'Nej. Han bryr sig om om de kan åka skridskor. Det är inte det sämsta.'],
    },
  },
  {
    id: 'hallen',
    question: 'Hallen. Alla har en åsikt om den. Du har inte sagt vad du tycker.',
    answers: [
      { id: 'A', text: 'Utan tak är vi borta om tio år. Jag säger som det är.' },
      { id: 'B', text: 'Bandy är utomhus. Tar man bort det tar man bort alltihop.' },
    ],
    returns: {
      A: ['Sture', 'Tränaren tror inte vi finns kvar utan tak.', 'Magnus', 'Han kanske har rätt. Det är det som är obehagligt.'],
      B: ['Magnus', 'Han vill ha kvar det utomhus.', 'Sture', 'Ja. Fråga honom igen i januari när det är tjugo minus.'],
    },
  },
  {
    id: 'varfor_du_kom_hit',
    question: 'Ingen har frågat dig varför du kom hit. Så jag gör det.',
    answers: [
      { id: 'A', text: 'Jag ville ha ett lag som är någons. Det här är någons.' },
      { id: 'B', text: 'Det var det här jobbet som fanns. Jag gör det så bra jag kan.' },
    ],
    returns: {
      A: ['Sture', 'Han sa att han ville ha ett lag som betyder något för någon.', 'Magnus', 'Då har han kommit rätt. Här betyder det för mycket.'],
      B: ['Magnus', 'Han var ärlig när jag frågade varför han kom. Sa att det var jobbet som fanns.', 'Sture', 'Bra. Då slipper vi den sortens tal på årsmötet.'],
    },
  },
  {
    id: 'vad_klubben_ar_till_for',
    question: 'Ska vi vinna nåt, eller ska vi bara finnas? Styrelsen säger båda.',
    answers: [
      { id: 'A', text: 'Finnas kvar först. Sen kan vi prata om att vinna.' },
      { id: 'B', text: 'Vi är här för att vinna. Annars kan vi lika gärna spela korpen.' },
    ],
    returns: {
      A: ['Sture', 'Han sätter överlevnaden först, sa han.', 'Magnus', 'Tråkigt. Men jag har sett klubbar som tänkte tvärtom och nu finns de inte.'],
      B: ['Sture', 'Han sa att vi är här för att vinna.', 'Magnus', 'Det var länge sen någon sa det rakt ut här inne.'],
    },
  },
  {
    id: 'klacken',
    question: 'Klacken har åsikter om dig. Bryr du dig om vad de tycker?',
    answers: [
      { id: 'A', text: 'De står där i minus femton. Klart jag bryr mig.' },
      { id: 'B', text: 'De får tycka. Jag väljer laget, inte de.' },
    ],
    returns: {
      A: ['Magnus', 'Han lyssnar på klacken, säger han.', 'Sture', 'Lyssnar, ja. Det är inte samma sak som att lyda.'],
      B: ['Sture', 'Han sa rakt ut att klacken inte bestämmer laget.', 'Magnus', 'Det kommer han få höra igen. Men han har ju rätt.'],
    },
  },
  {
    id: 'varfor_folk_kommer',
    question: 'Bruket gick ner, folk flyttade, och ändå står vi här på söndagarna. Vet du varför?',
    answers: [
      { id: 'A', text: 'För att det är det enda som är kvar.' },
      { id: 'B', text: 'För att det är bra bandy. Det räcker som skäl.' },
    ],
    returns: {
      A: ['Sture', 'Jag frågade varför folk kommer. Han sa: för att det är det enda som är kvar.', 'Magnus', 'Det är sant. Men jag hade hoppats på ett finare svar.'],
      B: ['Magnus', 'Han tycker vi kommer hit för bandyns skull.', 'Sture', 'Ja. Han har inte varit här tillräckligt länge för att veta bättre.'],
    },
  },
]
