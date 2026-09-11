/**
 * Kafferumsrepliker/narratorLine-strängar kommer ibland redan citat-inramade
 * ur poolen (t.ex. klackEchoText.ts:s kafferum-rader som citerar en person
 * rakt av). Komponenten wrappar ALLTID texten i citattecken — utan detta
 * dubbleras eller nästlas citattecknen ("Ex: "Citat.""). Strippar befintliga
 * inramande citattecken innan den lägger på exakt ett par, oavsett källa.
 */
export function wrapQuote(text: string): string {
  const stripped = text.trim().replace(/^"+/, '').replace(/"+$/, '')
  return `"${stripped}"`
}
