import type { EventLedgerType } from './Narrative'

/**
 * DOM_PASTAENDE_GENERERINGSKONTRAKT_2026-09-08: ett genererings-tids-
 * påstående (events/*, till skillnad från liggarfamiljens `provenBy` i
 * momentViewTemplates.ts, som beläggs av en RECORDAD historisk post) måste
 * deklarera EXAKT en av tre former. Grinden checkar FORM och att den
 * UTVÄRDERAS — aldrig att prosan är rätt, det kan ingen grind avgöra.
 *
 * - `state-predicate`: påståendet gejtas av ett predikat över game-state,
 *   utvärderat VID genereringen. `evaluatedTrue` är samma boolean som
 *   faktiskt styrde om eventet konstruerades — inte en omskriven kopia.
 * - `ledger`: påståendet refererar en RECORDAD historisk händelse — samma
 *   kontrakt som liggarfamiljens `provenBy`.
 * - `timeless`: inget predikat eller liggare kan belägga påståendet. Ett
 *   sådant påstående ska skrivas om till nutids-sant eller strykas — se
 *   domens §"Domen", form 3. Svensk ersättningstext är Opus, inte Code.
 */
export type ProofSource =
  | {
      form: 'state-predicate'
      /** Kort intern beskrivning av VILKET tillstånd som gör påståendet
       *  sant — inte kortets prosa, en beläggningsbeskrivning för grinden
       *  och framtida läsare. */
      description: string
      evaluatedTrue: boolean
    }
  | {
      form: 'ledger'
      ledgerType: EventLedgerType
    }
  | {
      form: 'timeless'
    }
