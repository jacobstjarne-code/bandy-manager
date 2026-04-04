// Local employers tied to club regions — used for varsel, workplace events, storylines

export interface LocalEmployer {
  name: string
  industry: string
  size: 'small' | 'medium' | 'large'
  region: string        // matches club region
  jobTitles: string[]   // possible jobs at this employer
}

// Employers grouped by region — each club's home region has 2-3 employers
export const LOCAL_EMPLOYERS: Record<string, LocalEmployer[]> = {
  sandviken: [
    { name: 'Sandvik AB', industry: 'Verkstad', size: 'large', region: 'sandviken', jobTitles: ['Svetsare', 'Ingenjör', 'Operatör', 'Lagerarbetare'] },
    { name: 'Gästrike Vatten', industry: 'Kommun', size: 'medium', region: 'sandviken', jobTitles: ['Drifttekniker', 'Administratör'] },
    { name: 'Göransson Arena', industry: 'Sport', size: 'small', region: 'sandviken', jobTitles: ['Banarbetare', 'Vaktmästare'] },
  ],
  edsbyn: [
    { name: 'Edsbyns Elverk', industry: 'Energi', size: 'medium', region: 'edsbyn', jobTitles: ['Elektriker', 'Drifttekniker'] },
    { name: 'Träslöjden Edsbyn', industry: 'Hantverk', size: 'small', region: 'edsbyn', jobTitles: ['Snickare', 'Finsnickare'] },
  ],
  vasteras: [
    { name: 'ABB', industry: 'Teknik', size: 'large', region: 'vasteras', jobTitles: ['Ingenjör', 'Systemutvecklare', 'Tekniker'] },
    { name: 'Västerås stad', industry: 'Kommun', size: 'large', region: 'vasteras', jobTitles: ['Lärare', 'Sjuksköterska', 'Administratör'] },
  ],
  sirius: [
    { name: 'Uppsala kommun', industry: 'Kommun', size: 'large', region: 'sirius', jobTitles: ['Lärare', 'Sjuksköterska', 'Brandman'] },
    { name: 'Uppsala universitet', industry: 'Utbildning', size: 'large', region: 'sirius', jobTitles: ['Forskningsassistent', 'Vaktmästare'] },
  ],
  broberg: [
    { name: 'BillerudKorsnäs', industry: 'Papper', size: 'large', region: 'broberg', jobTitles: ['Operatör', 'Mekaniker', 'Lagerarbetare'] },
    { name: 'Söderhamns kommun', industry: 'Kommun', size: 'medium', region: 'broberg', jobTitles: ['Lärare', 'Polis'] },
  ],
  falun: [
    { name: 'SSAB Borlänge', industry: 'Stål', size: 'large', region: 'falun', jobTitles: ['Svetsare', 'Operatör', 'Ingenjör'] },
    { name: 'Falu kommun', industry: 'Kommun', size: 'medium', region: 'falun', jobTitles: ['Lärare', 'Brandman'] },
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
