export const FAMILY_CONTEXTS: string[] = [
  'Morfar kommer med efterrätt på fredagarna.',
  'Sambon har jobb i Gävle — åker hem på helgerna.',
  'Äldsta sonen tävlingscyklar — planen var att titta på när han vinner JSM.',
  'Flickvännen har precis börjat på KI. Långdistansrelation som bara blev längre.',
  'Morsan har flyttat tillbaka till orten efter skilsmässan. Sover hos henne under rehab.',
  'Barnen är 4 och 2. Det blir mycket tid på soffan nu.',
  'Föräldrarna är båda sjukpensionärer. De lagar lunch till honom varje dag.',
  'Pappan, som själv spelade i A-laget på 80-talet, är på plats på varenda fysio.',
  'Systern är fysioterapeut. Sköter honom på hemmaplan.',
  'Bäste polare är reservmålvakt. Kör honom till varje rehab och pratar om allt annat.',
]

export const INJURY_CONTEXTS: Record<string, string[]> = {
  knä: [
    'Tog smällen sent i onsdagens träning. Ortopeden säger ledbandet är stukat men hel.',
    'Vred till knäet under en långsam pass. Ibland är det små rörelser som tar längst tid.',
    'Kraschade i en hörnsituation mot motståndaren. MR:n visade ödem men inget allvarligt.',
  ],
  axel: [
    'Tacklas mot sargen. Axeln gick ur led men sitter på plats efter sjukhusbesöket.',
    'Klarade av matchen men kunde inte lyfta armen dagen efter. Röntgen nästa vecka.',
    'Föll olyckligt i mittzonen. Rotatorkuffen är drabbad — kan dra ut på tiden.',
  ],
  vrist: [
    'Landade snett efter ett hopp i hörnsituationen. Vristen är svullen men röntgen visade inget brutet.',
    'Halka på is — klassiskt. Ligament sträckt, inte sönder.',
    'Trampade på en back och vred om foten. Stödja men inte belasta är ordningen.',
  ],
  huvud: [
    'Fick en armbåge mot tinningen. Lätt hjärnskakning — vila och mörkrum.',
    'Kollision med målvakten. Protokollet är sträng: inga träningar innan läkaren godkänner.',
    'Svimlade en sekund efter en närkamp. Allt är okej men försiktighetsprincipen gäller.',
  ],
  rygg: [
    'Ryggskott under uppvärmningen. Stelt men inget strukturellt skadat.',
    'Bur sin rygg under ett tryck mot sargen. Sjukgymnasterna pratar om muskelspänning.',
    'Gammal ryggproblematik blossade upp. Behandling och lätta övningar.',
  ],
  hamstring: [
    'Kände ett nagg i sprinthastighet. Klassisk hamstringsskada — veckors vila.',
    'Körde för hårt i det sista sprintpasset. Muskelfiber sönder.',
    'Magkände att det var fel men försökte ändå. Nu är det stopp.',
  ],
}

export function generateInjuryNarrative(
  existingFamilyContext: string | undefined,
  injuryType: string,
  rand: () => number,
): { narrative: string; familyContext: string } {
  const contexts = INJURY_CONTEXTS[injuryType] ?? INJURY_CONTEXTS.knä
  const context = contexts[Math.floor(rand() * contexts.length)]
  const family = existingFamilyContext ?? FAMILY_CONTEXTS[Math.floor(rand() * FAMILY_CONTEXTS.length)]
  const narrative = `${context} Han är i fysioterapi tre gånger i veckan. ${family}`
  return { narrative, familyContext: family }
}
