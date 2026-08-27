# docs/incoming

Designs leveranser landar här. **Mappen ska vara kort.** Är den lång betyder det att något inte blivit avgjort.

## Regeln

En fil ligger i `incoming/` bara så länge den väntar på ett beslut eller ett bygge.

När den är dömd och byggd: flytta till `_arkiv-<år>-<månad>/`. Underlaget finns kvar, men det syns inte som öppet.

Synkfilerna (`github-synk-*.md`) arkiveras direkt när deras leverans är behandlad — `github.md` är den löpande sanningen.

## Vad som ligger här nu, och varför

| Fil | Status |
|---|---|
| `Illustrationer-stilbibel-2026-08-18.dc.html` | **Aktiv referens.** Används varje gång en bild beställs. Ska stå kvar |
| `github.md` | **Aktiv.** Löpande synk mot repot |
| `Överlämning 2/` | **Delvis obyggd, känd skuld.** `Överlämning/` var samma leverans (sex delade filer byte-identiska, verifierat 2026-08-20) — arkiverad, bara denna kvar. Elva poster i steg 0-inventeringen (`CODE_INSTRUKTION_OVERLAMNING2_2026-08-11.md`), inte tolv. Fyra redan bekräftat byggda under verifieringen 2026-08-20 (ripple-kedjan, veckans beslut, Analys→Taktik-länken finns men "justering förvald" saknas — halvbyggt). **De två Designfrågorna (trait-emoji-taggarna, portal-orienteringens tredje förslag) är INTE öppna** — trait-emoji-taggarna är dömda (strukturerat fält + Lucide, tag-*-familjen finns) och portal-orienteringens tredje förslag visade sig redan byggt av en annan spec en månad tidigare (rapporterat 2026-08-25). Fjärde dokumentationsdriften denna session — README:n påstod öppna frågor som redan var stängda. Resterande poster kräver ett eget grep-pass — kör inte förrän sluttestkön är klar |
| `Spår B - textnivåer...` (juli) + md | **Status okänd.** Aldrig verifierad mot koden |
| `Ytkarta - hallprövning & landslag` | **Dömda beslut, inte planering** (verifierat 2026-08-20 — öppnad och läst, inte bara klassad). Ett nybygge (prövnings-hubbet, mockat), resten rider befintliga ytor |
| `Ytkarta - tre textpooler` | **Dömda beslut, inte planering** (samma verifiering). Ett nybygge (avskedsmatch pre-match-beat, mockat, öppen fråga till Jacob om placering), en radering rekommenderad (coach-citaten, 7 filer — ingen talare finns), resten rider befintliga ytor |
| `INVESTIGATION_MATCH_REVENUE_ECONOMY_2026-08-26.md` | **Underlag, väntar på fix.** Kodutredning (ingen kodändring ännu): visar att kiosk/lotteri/kommunbidrag redan finns och är kopplade i `calcRoundIncome`, men skalar med fanMood — aldrig med attendanceRate/communityStanding. Bekräftar också ett generellt sponsor-threshold-fynd (`communityStanding > 70`, hårdkodat, ingen klubbscoping). Väntar på att kopplas till en spec/fix för attendance-skalad intäkt |

**Arkiverat 2026-08-20** (byggt, verifierat rad för rad mot koden): `A1-KAFFERUMMET-BLIR-EN-PLATS-2026-07-19.md` + html (alla fem domar i koden), `CODE_INSTRUKTION_SIDFOT_INTRORAM_2026-07-10.md` (T1–T5 byggda), `RELÄ-Code-DS-konformans-svep1-3.md` + html (C1/C2/C4/C5 byggda, C3 fixades i samma svep, V1 var strukturellt PASS men saknade gate-täckning — `HalfTimeSummaryScreen` tillagd i `sceneRegistry.ts`), `Överlämning/` (dubblett av `Überlämning 2/`), `_RADERAS/` (raderad, inte arkiverad — den enda instruktionsfilen i mappen var redan byggd, resten var redan lästa audits).

## Nästa steg

`Spår B` är den enda kvarvarande "status okänd"-posten. `Överlämning 2/`s sju obekräftade poster är känd skuld — vänta med dem tills sluttestkön är klar.
