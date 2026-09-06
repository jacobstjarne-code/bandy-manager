/**
 * Tar bort instansens tidsdelar men bevarar person-, klubb- och
 * beslutsidentitet. Delas av Redaktören och producenter som måste känna igen
 * en tidigare upplöst berättelse.
 */
export function semanticKeyStem(semanticKey: string): string {
  return semanticKey
    .replace(/([:_-])s(?:eason)?\d+/gi, '')
    .replace(/([:_-])m(?:atchday)?\d+/gi, '')
    .replace(/([:_-])r(?:ound)?\d+/gi, '')
    .replace(/:{2,}/g, ':')
    .replace(/_{2,}/g, '_')
}
