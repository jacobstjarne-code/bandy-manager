// Local employers tied to club regions — used for varsel, workplace events, storylines

export interface LocalEmployer {
  name: string
  industry: string
  size: 'small' | 'medium' | 'large'
  region: string        // matches club region
  jobTitles: string[]   // possible jobs at this employer
}

// Employers grouped by region — each club's home region has 2-3 employers.
// Textaudit domän 2b (2026-07-03): tidigare regionsnycklar (sandviken, edsbyn,
// vasteras, sirius, broberg, falun) tillhörde en äldre klubblista — spelets tolv
// orter träffade aldrig dem och ALLT föll till default. Omskriven för spelets
// regioner; bolagsnamnen synkade mot mecenatService.REGION_BUSINESSES så att
// patronens bruk och spelarnas arbetsgivare är samma värld.
//
// M31 (textaudit 2026-07-03, breddning 2026-07-05): 7 av 15 DAY_JOB_TITLES
// (IT-konsult, Polis, Säljare, Lastbilsförare, Byggnadsarbetare, Ekonom,
// Personlig tränare) matchade ingen arbetsgivares jobTitles och kunde därför
// aldrig trigga coworker-bond/varsel-gruppering. Jacobs beslut: bredda
// arbetsgivarna, ingen titel struken. Ekonom/IT-konsult → alla Kommun-
// arbetsgivare (kommunen/banken-slotten, ingen bank finns än). Lastbilsförare
// → Transport-arbetsgivarna (Öresunds/Gävle Logistik). Byggnadsarbetare →
// Bygg-arbetsgivarna (Flens/Skåne Bygg). Säljare → Handel-arbetsgivaren
// (Gästrike Bil). Polis/Personlig tränare finns inte naturligt hos någon
// befintlig arbetsgivare — varje region fick två generiska nya arbetsgivare
// ('Polisen', myndighetsnamnet självt; 'Gymmet', fiktivt generiskt namn,
// ingen kedja) istf att tvinga in titlarna där de inte hör hemma.
export const LOCAL_EMPLOYERS: Record<string, LocalEmployer[]> = {
  forsbacka: [
    { name: 'Forsbacka Järnbruk', industry: 'Stål', size: 'large', region: 'forsbacka', jobTitles: ['Svetsare', 'Operatör', 'Mekaniker', 'Lagerarbetare'] },
    { name: 'Sandvikens kommun', industry: 'Kommun', size: 'medium', region: 'forsbacka', jobTitles: ['Lärare', 'Vaktmästare', 'Administratör', 'Ekonom', 'IT-konsult'] },
    { name: 'Gästrike Bil', industry: 'Handel', size: 'small', region: 'forsbacka', jobTitles: ['Mekaniker', 'Tekniker', 'Säljare'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'forsbacka', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'forsbacka', jobTitles: ['Personlig tränare'] },
  ],
  soderfors: [
    { name: 'Söderfors Stålverk', industry: 'Stål', size: 'large', region: 'soderfors', jobTitles: ['Operatör', 'Svetsare', 'Ingenjör', 'Lagerarbetare'] },
    { name: 'Tierps kommun', industry: 'Kommun', size: 'medium', region: 'soderfors', jobTitles: ['Lärare', 'Sjuksköterska', 'Administratör', 'Ekonom', 'IT-konsult'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'soderfors', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'soderfors', jobTitles: ['Personlig tränare'] },
  ],
  vastanfors: [
    { name: 'Västanfors Mekaniska', industry: 'Verkstad', size: 'medium', region: 'vastanfors', jobTitles: ['Operatör', 'Mekaniker', 'Svetsare'] },
    { name: 'Fagersta kommun', industry: 'Kommun', size: 'medium', region: 'vastanfors', jobTitles: ['Lärare', 'Vaktmästare', 'Ekonom', 'IT-konsult'] },
    { name: 'VoltaSystem AB', industry: 'Teknik', size: 'small', region: 'vastanfors', jobTitles: ['Systemutvecklare', 'Tekniker', 'IT-konsult'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'vastanfors', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'vastanfors', jobTitles: ['Personlig tränare'] },
  ],
  karlsborg: [
    { name: 'Karlsborgs Järnbruk', industry: 'Stål', size: 'large', region: 'karlsborg', jobTitles: ['Operatör', 'Svetsare', 'Lagerarbetare'] },
    { name: 'Lapplands Trä', industry: 'Skog', size: 'medium', region: 'karlsborg', jobTitles: ['Snickare', 'Lagerarbetare', 'Operatör'] },
    { name: 'Kalix kommun', industry: 'Kommun', size: 'medium', region: 'karlsborg', jobTitles: ['Lärare', 'Administratör', 'Ekonom', 'IT-konsult'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'karlsborg', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'karlsborg', jobTitles: ['Personlig tränare'] },
  ],
  malilla: [
    { name: 'Målilla Glasbruk', industry: 'Glas', size: 'medium', region: 'malilla', jobTitles: ['Operatör', 'Tekniker'] },
    { name: 'Hultsfreds Smide', industry: 'Verkstad', size: 'small', region: 'malilla', jobTitles: ['Svetsare', 'Mekaniker'] },
    { name: 'Hultsfreds kommun', industry: 'Kommun', size: 'medium', region: 'malilla', jobTitles: ['Lärare', 'Vaktmästare', 'Ekonom', 'IT-konsult'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'malilla', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'malilla', jobTitles: ['Personlig tränare'] },
  ],
  gagnef: [
    { name: 'Gagnefs Sågverk', industry: 'Trä', size: 'medium', region: 'gagnef', jobTitles: ['Operatör', 'Lagerarbetare', 'Snickare'] },
    { name: 'Dalarnas Trävaror', industry: 'Trä', size: 'small', region: 'gagnef', jobTitles: ['Snickare', 'Finsnickare'] },
    { name: 'Gagnefs kommun', industry: 'Kommun', size: 'medium', region: 'gagnef', jobTitles: ['Lärare', 'Administratör', 'Ekonom', 'IT-konsult'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'gagnef', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'gagnef', jobTitles: ['Personlig tränare'] },
  ],
  halleforsnas: [
    { name: 'Hälleforsnäs Järnbruk', industry: 'Gjuteri', size: 'medium', region: 'halleforsnas', jobTitles: ['Operatör', 'Svetsare', 'Mekaniker'] },
    { name: 'Flens kommun', industry: 'Kommun', size: 'medium', region: 'halleforsnas', jobTitles: ['Lärare', 'Sjuksköterska', 'Ekonom', 'IT-konsult'] },
    { name: 'Flens Bygg', industry: 'Bygg', size: 'small', region: 'halleforsnas', jobTitles: ['Snickare', 'Elektriker', 'Byggnadsarbetare'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'halleforsnas', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'halleforsnas', jobTitles: ['Personlig tränare'] },
  ],
  lesjofors: [
    { name: 'Lesjöfors Fjäderfabrik', industry: 'Verkstad', size: 'large', region: 'lesjofors', jobTitles: ['Operatör', 'Mekaniker', 'Ingenjör', 'Lagerarbetare'] },
    { name: 'Filipstads kommun', industry: 'Kommun', size: 'medium', region: 'lesjofors', jobTitles: ['Lärare', 'Vaktmästare', 'Ekonom', 'IT-konsult'] },
    { name: 'Värmlandsskog', industry: 'Skog', size: 'small', region: 'lesjofors', jobTitles: ['Snickare', 'Lagerarbetare'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'lesjofors', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'lesjofors', jobTitles: ['Personlig tränare'] },
  ],
  rogle: [
    { name: 'Öresunds Logistik', industry: 'Transport', size: 'medium', region: 'rogle', jobTitles: ['Lagerarbetare', 'Administratör', 'Tekniker', 'Lastbilsförare'] },
    { name: 'Ängelholms kommun', industry: 'Kommun', size: 'large', region: 'rogle', jobTitles: ['Lärare', 'Sjuksköterska', 'Brandman', 'Ekonom', 'IT-konsult'] },
    { name: 'Skåne Bygg', industry: 'Bygg', size: 'small', region: 'rogle', jobTitles: ['Snickare', 'Elektriker', 'Byggnadsarbetare'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'rogle', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'rogle', jobTitles: ['Personlig tränare'] },
  ],
  slottsbron: [
    { name: 'Slottsbrons Pappersbruk', industry: 'Papper', size: 'large', region: 'slottsbron', jobTitles: ['Operatör', 'Mekaniker', 'Drifttekniker', 'Lagerarbetare'] },
    { name: 'Grums kommun', industry: 'Kommun', size: 'medium', region: 'slottsbron', jobTitles: ['Lärare', 'Administratör', 'Ekonom', 'IT-konsult'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'slottsbron', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'slottsbron', jobTitles: ['Personlig tränare'] },
  ],
  skutskar: [
    { name: 'Skutskärs Massafabrik', industry: 'Papper', size: 'large', region: 'skutskar', jobTitles: ['Operatör', 'Drifttekniker', 'Mekaniker', 'Lagerarbetare'] },
    { name: 'Älvkarleby kommun', industry: 'Kommun', size: 'medium', region: 'skutskar', jobTitles: ['Lärare', 'Vaktmästare', 'Ekonom', 'IT-konsult'] },
    { name: 'Gävle Logistik', industry: 'Transport', size: 'small', region: 'skutskar', jobTitles: ['Lagerarbetare', 'Tekniker', 'Lastbilsförare'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'skutskar', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'skutskar', jobTitles: ['Personlig tränare'] },
  ],
  heros: [
    { name: 'Heros Bruk', industry: 'Industri', size: 'large', region: 'heros', jobTitles: ['Operatör', 'Svetsare', 'Lagerarbetare'] },
    { name: 'Kommunen', industry: 'Kommun', size: 'medium', region: 'heros', jobTitles: ['Lärare', 'Vaktmästare', 'Administratör', 'Ekonom', 'IT-konsult'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'heros', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'heros', jobTitles: ['Personlig tränare'] },
  ],
  default: [
    { name: 'Lokala bruket', industry: 'Industri', size: 'medium', region: 'default', jobTitles: ['Operatör', 'Mekaniker', 'Lagerarbetare'] },
    { name: 'Kommunen', industry: 'Kommun', size: 'medium', region: 'default', jobTitles: ['Lärare', 'Vaktmästare', 'Administratör', 'Ekonom', 'IT-konsult'] },
    { name: 'Polisen', industry: 'Myndighet', size: 'small', region: 'default', jobTitles: ['Polis'] },
    { name: 'Gymmet', industry: 'Fritid', size: 'small', region: 'default', jobTitles: ['Personlig tränare'] },
  ],
}

/**
 * Get employers for a club's region.
 * Falls back to 'default' if no region-specific employers exist.
 */
export function getEmployersForClub(clubId: string): LocalEmployer[] {
  const region = clubId.replace('club_', '')
  return LOCAL_EMPLOYERS[region] ?? LOCAL_EMPLOYERS.default
}

/**
 * Find the employer that matches a player's day job title.
 */
export function findEmployerForJob(clubId: string, jobTitle: string): LocalEmployer | undefined {
  const employers = getEmployersForClub(clubId)
  return employers.find(e => e.jobTitles.some(j =>
    j.toLowerCase() === jobTitle.toLowerCase()
  ))
}
