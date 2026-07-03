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
export const LOCAL_EMPLOYERS: Record<string, LocalEmployer[]> = {
  forsbacka: [
    { name: 'Forsbacka Järnbruk', industry: 'Stål', size: 'large', region: 'forsbacka', jobTitles: ['Svetsare', 'Operatör', 'Mekaniker', 'Lagerarbetare'] },
    { name: 'Sandvikens kommun', industry: 'Kommun', size: 'medium', region: 'forsbacka', jobTitles: ['Lärare', 'Vaktmästare', 'Administratör'] },
    { name: 'Gästrike Bil', industry: 'Handel', size: 'small', region: 'forsbacka', jobTitles: ['Mekaniker', 'Tekniker'] },
  ],
  soderfors: [
    { name: 'Söderfors Stålverk', industry: 'Stål', size: 'large', region: 'soderfors', jobTitles: ['Operatör', 'Svetsare', 'Ingenjör', 'Lagerarbetare'] },
    { name: 'Tierps kommun', industry: 'Kommun', size: 'medium', region: 'soderfors', jobTitles: ['Lärare', 'Sjuksköterska', 'Administratör'] },
  ],
  vastanfors: [
    { name: 'Västanfors Mekaniska', industry: 'Verkstad', size: 'medium', region: 'vastanfors', jobTitles: ['Operatör', 'Mekaniker', 'Svetsare'] },
    { name: 'Fagersta kommun', industry: 'Kommun', size: 'medium', region: 'vastanfors', jobTitles: ['Lärare', 'Vaktmästare'] },
    { name: 'VoltaSystem AB', industry: 'Teknik', size: 'small', region: 'vastanfors', jobTitles: ['Systemutvecklare', 'Tekniker'] },
  ],
  karlsborg: [
    { name: 'Karlsborgs Järnbruk', industry: 'Stål', size: 'large', region: 'karlsborg', jobTitles: ['Operatör', 'Svetsare', 'Lagerarbetare'] },
    { name: 'Lapplands Trä', industry: 'Skog', size: 'medium', region: 'karlsborg', jobTitles: ['Snickare', 'Lagerarbetare', 'Operatör'] },
    { name: 'Kalix kommun', industry: 'Kommun', size: 'medium', region: 'karlsborg', jobTitles: ['Lärare', 'Administratör'] },
  ],
  malilla: [
    { name: 'Målilla Glasbruk', industry: 'Glas', size: 'medium', region: 'malilla', jobTitles: ['Operatör', 'Tekniker'] },
    { name: 'Hultsfreds Smide', industry: 'Verkstad', size: 'small', region: 'malilla', jobTitles: ['Svetsare', 'Mekaniker'] },
    { name: 'Hultsfreds kommun', industry: 'Kommun', size: 'medium', region: 'malilla', jobTitles: ['Lärare', 'Vaktmästare'] },
  ],
  gagnef: [
    { name: 'Gagnefs Sågverk', industry: 'Trä', size: 'medium', region: 'gagnef', jobTitles: ['Operatör', 'Lagerarbetare', 'Snickare'] },
    { name: 'Dalarnas Trävaror', industry: 'Trä', size: 'small', region: 'gagnef', jobTitles: ['Snickare', 'Finsnickare'] },
    { name: 'Gagnefs kommun', industry: 'Kommun', size: 'medium', region: 'gagnef', jobTitles: ['Lärare', 'Administratör'] },
  ],
  halleforsnas: [
    { name: 'Hälleforsnäs Järnbruk', industry: 'Gjuteri', size: 'medium', region: 'halleforsnas', jobTitles: ['Operatör', 'Svetsare', 'Mekaniker'] },
    { name: 'Flens kommun', industry: 'Kommun', size: 'medium', region: 'halleforsnas', jobTitles: ['Lärare', 'Sjuksköterska'] },
    { name: 'Flens Bygg', industry: 'Bygg', size: 'small', region: 'halleforsnas', jobTitles: ['Snickare', 'Elektriker'] },
  ],
  lesjofors: [
    { name: 'Lesjöfors Fjäderfabrik', industry: 'Verkstad', size: 'large', region: 'lesjofors', jobTitles: ['Operatör', 'Mekaniker', 'Ingenjör', 'Lagerarbetare'] },
    { name: 'Filipstads kommun', industry: 'Kommun', size: 'medium', region: 'lesjofors', jobTitles: ['Lärare', 'Vaktmästare'] },
    { name: 'Värmlandsskog', industry: 'Skog', size: 'small', region: 'lesjofors', jobTitles: ['Snickare', 'Lagerarbetare'] },
  ],
  rogle: [
    { name: 'Öresunds Logistik', industry: 'Transport', size: 'medium', region: 'rogle', jobTitles: ['Lagerarbetare', 'Administratör', 'Tekniker'] },
    { name: 'Ängelholms kommun', industry: 'Kommun', size: 'large', region: 'rogle', jobTitles: ['Lärare', 'Sjuksköterska', 'Brandman'] },
    { name: 'Skåne Bygg', industry: 'Bygg', size: 'small', region: 'rogle', jobTitles: ['Snickare', 'Elektriker'] },
  ],
  slottsbron: [
    { name: 'Slottsbrons Pappersbruk', industry: 'Papper', size: 'large', region: 'slottsbron', jobTitles: ['Operatör', 'Mekaniker', 'Drifttekniker', 'Lagerarbetare'] },
    { name: 'Grums kommun', industry: 'Kommun', size: 'medium', region: 'slottsbron', jobTitles: ['Lärare', 'Administratör'] },
  ],
  skutskar: [
    { name: 'Skutskärs Massafabrik', industry: 'Papper', size: 'large', region: 'skutskar', jobTitles: ['Operatör', 'Drifttekniker', 'Mekaniker', 'Lagerarbetare'] },
    { name: 'Älvkarleby kommun', industry: 'Kommun', size: 'medium', region: 'skutskar', jobTitles: ['Lärare', 'Vaktmästare'] },
    { name: 'Gävle Logistik', industry: 'Transport', size: 'small', region: 'skutskar', jobTitles: ['Lagerarbetare', 'Tekniker'] },
  ],
  heros: [
    { name: 'Heros Bruk', industry: 'Industri', size: 'large', region: 'heros', jobTitles: ['Operatör', 'Svetsare', 'Lagerarbetare'] },
    { name: 'Kommunen', industry: 'Kommun', size: 'medium', region: 'heros', jobTitles: ['Lärare', 'Vaktmästare', 'Administratör'] },
  ],
  default: [
    { name: 'Lokala bruket', industry: 'Industri', size: 'medium', region: 'default', jobTitles: ['Operatör', 'Mekaniker', 'Lagerarbetare'] },
    { name: 'Kommunen', industry: 'Kommun', size: 'medium', region: 'default', jobTitles: ['Lärare', 'Vaktmästare', 'Administratör'] },
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
