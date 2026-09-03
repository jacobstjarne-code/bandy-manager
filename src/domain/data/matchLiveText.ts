/**
 * matchLiveText.ts — Spak A (paussnack), Spak B (sent matchningsval) och
 * MomentumBar-brytpunkter. Opus-text 2026-06-08.
 *
 * §2 ÄRLIGHETSPRINCIPEN styr effekt-etiketterna (HÅRD, se DESIGN-BRIEF-MOTORKANSLA):
 * de lovar RIKTNING + grov magnitud, ALDRIG utfall. "↑ ert tryck i andra" är ärligt;
 * "vänder matchen" / "säkrar segern" är en §2-lögn. En etikett får bara lova det den
 * verkliga variabeln gör — previewbaren och utfallsbaren ska spegla SAMMA variabel,
 * annars lär den spelaren läsa fel.
 *
 * Variabelnamn (postBreakUrgency, lateFactor) är INTE spelarvänd text. De lever i
 * kod och i mockens dev-annoteringar — aldrig i UI. Spelaren ser riktningen (bar-luten,
 * pilen, etiketten), inte motorns interna namn.
 */

export type MatchSituation = 'behind' | 'level' | 'leading'

export interface PepOption {
  /** Tränarens replik (.pep-t, Georgia). Bandysvensk, terst, ingen rah-rah. */
  line: string
  /** Ärlig effekt-etikett (.pep-e, mono). Riktning, ej utfall. */
  effect: string
  /** Previewbarens lut: 'push' = höjer ert tryck (mot er, +varians); 'calm' = dämpar
   *  deras post-paus-svall (stabilt); 'hold' = oförändrat. Code mappar till bar-riktning. */
  lean: 'push' | 'calm' | 'hold'
}

export const PAUSSNACK_EYEBROW: Record<MatchSituation, string> = {
  behind:  '⬩ Paussnack · ni jagar ⬩',
  level:   '⬩ Paussnack · jämnt ⬩',
  leading: '⬩ Paussnack · ni leder ⬩',
}

/** Förstaalternativet (index 0) är default-markerat i mocken — det "aktiva" valet per läge. */
export const PAUSSNACK: Record<MatchSituation, PepOption[]> = {
  behind: [
    { line: 'Upp på deras halva direkt, det här vänder vi.', effect: '↑ ert tryck i andra · ↑ varians', lean: 'push' },
    { line: 'Inget stressande. Spela som ni kan, så kommer det.', effect: '→ oförändrat tryck · stabilare', lean: 'hold' },
  ],
  level: [
    { line: 'Den här är vår att ta. Upp i tempo.', effect: '↑ ert tryck i andra · ↑ varians', lean: 'push' },
    { line: 'Lugnt och rätt. Tappa inte tålamodet.', effect: '→ oförändrat · stabilare', lean: 'hold' },
  ],
  leading: [
    { line: 'Håll i det. Inga dumheter bakåt.', effect: '↓ deras tryck i andra · stabilare', lean: 'calm' },
    { line: 'Nöj er inte. En till så är den död.', effect: '↑ jakt även i ledning · ↑ varians', lean: 'push' },
  ],
}

/** .prev-l — previewbarens etikett (mono, uppercase i CSS). */
export const PAUSSNACK_PREVIEW_LABEL = 'Förväntad riktning på baren i andra'

// ── Spak B — sent matchningsval (feed-kort, tänds sent i jämnt läge) ─────────
// §2: push och shut speglar varandra ärligt — gå på höjer BÅDE chans och risk,
// stäng igen sänker BÅDE. Ingen sida lovar utfall ("säkra poängen" är borttaget:
// det stänger ner variansen, det garanterar inte poängen).
export const SENT_VAL = {
  /** {minut} interpoleras (matchminut). */
  eyebrow: '⬩ {minut}\u2032 · jämnt · det öppnar upp ⬩',
  question: 'Gå för vinsten, eller stäng igen?',
  push: { title: 'Gå på', effect: '↑ chans · ↑ risk' },
  shut: { title: 'Stäng igen', effect: '↓ risk · ↓ chans' },
  gate: 'Tänds bara sent i jämna lägen.',
}

// ── MomentumBar — brytpunkts-etiketter ("lär spelaren läsa baren", brief §4.1) ──
// {lag} interpoleras. Speglar verkligt motortillstånd (§2). INGEN variabel-tag i UI —
// dev-annoteringen "speglar postBreakUrgency" i mocken stannar i mocken.
export const BRYTPUNKT = {
  postPaus: 'Andra halvlek — {lag} trycker på. Det jagande laget får luft.',
  kvittering: 'Kvittering — {lag} har farten med sig.',
  sent: 'Det öppnar upp. Svängningarna vidgas — matchen vill avgöras.',
}
