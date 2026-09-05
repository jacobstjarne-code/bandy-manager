/**
 * SPEC_FORHANDLING_TERMER_2026-09-04 (C-T8) §6 — TEXT LÅST, kopierad
 * ordagrant. Fyra förhandlingstermer (handpenning/boende/jobb/ansikte) läggs
 * till lön+år. Code skriver aldrig egen svensk prosa (CLAUDE.md) — alla
 * strängar nedan är Opus text, bara interpolerade av kod.
 */
import type { ContractTermKey } from '../services/contractNegotiationService'

export const CONTRACT_TERM_CHIP_LABELS: Record<ContractTermKey, string> = {
  signOnBonus: 'Handpenning',
  housing: 'Lägenhet',
  jobGuarantee: 'Jobb',
  imageRights: 'Ansikte',
}

export function contractTermChipSubtext(key: ContractTermKey, ctx: { signOnKr?: number; sponsorName?: string }): string {
  switch (key) {
    case 'signOnBonus':
      return `${Math.round((ctx.signOnKr ?? 0) / 1000)} tkr nu, ur kassan`
    case 'housing':
      return '3 tkr/mån så länge kontraktet gäller'
    case 'jobGuarantee':
      return `Via ${ctx.sponsorName ?? 'sponsorn'}. Ingen kostnad — en tjänst.`
    case 'imageRights':
      return `${ctx.sponsorName ?? 'Sponsorn'} betalar honom direkt. Ni släpper tio procent.`
  }
}

/** §6 Summering — {termer} är bara det som faktiskt drar lönebudgeten (boende). */
export function contractTermSummaryText(salaryKr: number, monthlyTermKr: number, signOnKr: number): string {
  const lonDel = `${Math.round(salaryKr / 1000)} tkr/mån`
  const termerDel = monthlyTermKr > 0 ? ` + ${Math.round(monthlyTermKr / 1000)} tkr/mån` : ''
  const bonusDel = signOnKr > 0 ? `, ${Math.round(signOnKr / 1000)} tkr nu` : ''
  return `Kostar klubben: ${lonDel}${termerDel}${bonusDel}.`
}

/** §6 — motbud som föreslår en term. `null`-nyckel = term-lös motpart (som idag). */
export function contractTermReactionText(key: ContractTermKey | null, name: string, sponsorName?: string): string {
  switch (key) {
    case 'signOnBonus':
      return `${name} nickar åt lönen men tittar på golvet. "Det är det första året som är svårt." Han vill ha något i handen nu.`
    case 'housing':
      return '"Var ska jag bo?" Det är hela frågan. Ordna en lägenhet, så är resten enkelt.'
    case 'jobGuarantee':
      return `${name} har en familj och ett liv någon annanstans. "Finns det ett jobb?" Utan det är lönen bara en siffra.`
    case 'imageRights':
      return `Han vet vad han är värd på en affisch. "Prata med ${sponsorName ?? 'sponsorn'}." Det är inte pengarna — det är att synas.`
    case null:
      return `${name} skakar på huvudet. Inte det där. Han säger ett tal.`
  }
}

/** §6 — accept med term, en rad per accepterad term. */
export function contractTermAcceptText(key: ContractTermKey, name: string, sponsorName?: string): string {
  switch (key) {
    case 'signOnBonus':
      return `${name} skrev på. Handpenningen gick till något du inte behöver veta.`
    case 'housing':
      return `${name} skrev på. Han flyttar in i februari — nycklarna ligger på kansliet.`
    case 'jobGuarantee':
      return `${name} skrev på. Måndag börjar han hos ${sponsorName ?? 'sponsorn'}. Träning tisdag.`
    case 'imageRights':
      return `${name} skrev på. Om en vecka hänger han på ${sponsorName ?? 'sponsorn'}s skyltfönster.`
  }
}

/** §6 — event jobbet_forsvann, avfyras när sponsorn/patronen bakom en bunden jobbgaranti lämnar. */
export const JOBBET_FORSVANN_TEXT = {
  title: (name: string) => `${name}s jobb är borta`,
  body: (sponsorName: string, name: string) =>
    `${sponsorName} lämnade — och med dem jobbet du lovade ${name}. Han står i kansliet med en fråga du inte kan svara på med ett leende.`,
  choices: {
    raiseSalary: { label: 'Höj lönen', subtitle: 'Kompensationen han bad om' },
    findAnother: { label: 'Vi hittar något', subtitle: 'Ett löfte till' },
    honest: { label: 'Det var inte vårt löfte att hålla', subtitle: 'Ärligt, men han glömmer det inte' },
  },
  // §7 återfall — samma spelare, andra gången.
  relapsePrefix: 'Andra jobbet han förlorat på ditt löfte. ',
} as const

/** §6 — pressfråga (k11-stam, ansikte). */
export function imageRightsPressQuestion(name: string, sponsorName: string, matchesWithoutGoal: number): string {
  return `${name} hänger på ${sponsorName}s affischer och har inte gjort mål på ${matchesWithoutGoal} matcher. Är han värd sin plats — på planen eller på väggen?`
}
