# BEVARANDELISTA — text-utan-yta

Skriven 2026-07-21, efter release-svepet. Inventerar **färdig, auditerad text
vars konsumentyta inte finns**. Enligt bevaranderegeln i CLAUDE.md:
superseterad kod raderas, text-utan-yta dödmarkeras och bevaras.

Den här filen finns för att texten ska vara **återupplivningsbar** — när en yta
någon gång byggs ska ingen behöva skriva om det som redan är skrivet och dömt.
Ingen rad här är en uppgift. Det är ett lager.

---

## VÄNTAR PÅ MEKANIK (blockerad av mer än en yta)

**`LOBBY_PRESS`** — `landslagText.ts`
Veckans lobbybeslut inför landslagsuttagning (prompt, accepterat, avböjt).
Parkerad i release-svepet: kräver persistent state + påverkan på uttagnings-
oddsen, alltså ny mekanik, inte wiring. De tre syskonpoolerna i samma fil
(notis, frånvaro, snub) är wirade och lever.
Väntar på: veckobeslutets andra form, eller en egen lobbymekanik.

**`diaryLine`** — kafferumsgrenen
Klassad i städsvepet som text-utan-yta; dess tänkta konsument var själv död kod.
Bevarad orörd.
Väntar på: en dagbok/krönika-yta som inte finns.

---

## KAN HA FÅTT ETT HEM — VERIFIERA

**`HALL_NEWS_POSITIVE` · `HALL_NEWS_NEGATIVE` · `HALL_NEWS_OUTDOOR_PRIDE` ·
`BOARD_HALL_QUOTES`** — `hallDebateData.ts`
Dödmarkerade i M67b (2026-07-13) med motiveringen "framtidsinnehåll för
hallprocessen (B1), auditerat och klart att wira när processtegen byggs".

**Processtegen är nu byggda.** Release-svepets block 3 wirade hallprövningens
fyra pooler och byggde H·1-hubben (`/game/hall-provning`) med stödmätare och
krav-checklista. Förutsättningen dessa fyra pooler väntade på finns alltså.

Att verifiera: har hallprocessen nu en debatt-/nyhetsyta som kan bära dem, eller
väntar de fortfarande på en egen? Obs M61-flaggan som fortfarande gäller:
`{hallclub}` får inte substitueras med en av spelets tolv Elitserieklubbar — de
är utomhusklubbar, hallen är drömbyggnation. Ska vara omvärldsklubb.

---

## SMÅ ORPHANS — EJ TÄCKTA AV STÄDSVEPET

Dessa kom ur den mekaniska orphan-sweepen men låg utanför städordern. Ingen är
en halvfärdig feature; var och en är en enskild pool utan konsument.

| Fil | Export | Vad det är |
|---|---|---|
| `communityNames.ts` | `KIOSK_FLAVORS` | Kiosk-färgtext |
| `communityNames.ts` | `LOTTERY_FLAVORS` | Lotteri-färgtext |
| `communityNames.ts` | `EVENT_FLAVORS` | Evenemangs-färgtext |
| `specialDateStrings.ts` | `STUDAN_FACTS` | SM-finalarenans lore (historik, publikrekord, ikoniska matcher) |
| `specialDateStrings.ts` | `SAVSTAAS_FACTS` | Cupfinalarenans lore |
| `suspensionText.ts` | `SUSPENSION_INCIDENT_MULTI_LINES` | Flermatchsavstängning (enkelvarianten är wirad) |
| `suspensionText.ts` | `SUSPENSION_RETURN_LINES` | Avstängning avtjänad, spelare tillgänglig |
| `windowDeadlineText.ts` | `DEADLINE_KAFFERUM_TEXT` | Kafferumsprat om transferdeadline |
| `anniversaryMemoryRowText.ts` | `anniversaryRowDetail` | Detaljvariant (label-varianten är wirad) |
| `facilityPortalBeats.ts` | `FACILITY_AVAILABLE_BEAT` | "Nod blev tillgänglig"-beat |
| `facilityPortalBeats.ts` | `HALL_PROCESS_BEATS` | Hallprocess-beats |
| `upptaktCopy.ts` | `MUSTWIN_CRIT_TAGS` | Taggar ('Måstematch' m.fl.) |

Typ-only, noll runtime-kostnad: `AssistantFFInteraction`
(`assistantFFStrings.ts`), `RetirementOutcome` (`retirementText.ts`),
`TabIntroKey` (`tabIntros.ts`).

Två med naturligt nära hem, värda en blick före resten:
`DEADLINE_KAFFERUM_TEXT` (kafferummet finns och är nyss utbyggt) och
`SUSPENSION_RETURN_LINES` (recovery-poolen byggdes nyss i samma mönster).

---

## REGELN SOM GÄLLER

Ingen rad i den här filen raderas för att den är "död kod". De är död **yta**,
inte död text. Radering här förstör arbete som inte kan återupplivas utan att
skrivas om från grunden.

Superseterad kod — ett förstautkast som en levande version ersatt — raderas
tvärtom alltid, eftersom att lämna den skapar fällan att nästa läsare wirar mot
fel version (getCoffeeRoomQuote, getSeasonPhase, getBoardMeetingBeats).
