# BESLUT — Mentorskapets kanon + Förb 5 yta E + läsbarhet (2026-06-20)

**Beslutsägare:** Jacob RATIFICERADE 2026-06-20 — kanon låst (Fable bekräftade samma destination mot källan). **Trigger:** två parallella mentorskapssystem upptäckta vid Förb 5-arbetet; yta E (mentorskaps-konsekvensrad) blockerad tills ett är kanon. Båda verifierade mot live-källan 2026-06-20.

---

## De två systemen (as-built)

**System 1 — Ledarskaps-action `'mentor'`**
`leadershipService.ts` (`applyLeadershipAction` case `'mentor'`) + `playerDevelopmentService.ts` (MENTOR_CA_BONUS, PC-6) + PlayerCard-knappen "🎓 Sätt som mentor".
- Mentor = du väljer (en av fyra ledarskapsknappar på spelarkortet).
- Adept = **AUTO** — yngsta spelaren <22 i A-truppen. Du styr inte vem.
- Effekt = CA-utvecklingsbonus över 8 omg, läst av `applyRoundDevelopment`.
- UI efter klick = **inget bestående** — bara en transient feedback-rad. `getActiveLeadershipAction` finns men renderas aldrig. Ingen badge.

**System 2 — Akademi-mentorskap** *(kanon, se beslut)*
`game.mentorships` + `youthProcessor.ts` (effekt) + `AkademiTab.tsx` (UI) + `academyActions.ts` (assign/remove).
- Mentor = du väljer (senior ≥25, disciplin >60).
- Adept = **du väljer** (P19 eller uppflyttad akademispelare).
- Effekt = per omgång, om mentor.form ≥40: adeptens `developmentRate += (disciplin/20)×0.1` + confidence +1. Skalar med disciplin, pausas utan form.
- UI = bestående, läsbar paring "{mentor} → {adept}" i Akademi-fliken, max 3, med Ta bort.

---

## Beslut (Jacob ratificerade 2026-06-20 — LÅST)

**Mentorskapet = System 2.** System 1:s `'mentor'`-action klipps ur Ledarskaps-panelen. **MEN veteran→ung A-spelare BEVARAS** (Jacob 2026-06-20) — inte genom att behålla system 1, utan genom att vidga system 2:s adept-behörighet till A-trupps-U22 (inte bara P19/akademiprodukter). Fantasin "kaptenen tar den unge under sina vingar" lever vidare, routad genom det bra systemet. Detaljerna i (C).

**Varför:**
1. **Två system, ett koncept, noll koppling.** Båda betyder "senior utvecklar junior". En spelare kan idag vara mentor i båda samtidigt, med två olika osynliga effekter som inte vet om varandra. Det är inte djup — det är förvirring.
2. **System 2 är rätt modell.** Båda ändar valda (agens), bestående läsbar paring (du ser X→Y), kurerad (disciplin-tröskel, max 3), rätt hemvist (Akademi = ungdomsutveckling), rätt knappvokabulär (`.btn`).
3. **System 1 ligger fel och är svagast.** Adept AUTO (du styr inte vem som gynnas), osynlig efter klick (bryter promise↔konsekvens, Lesson #41 — löftet syns aldrig som ett tillstånd). Och kategoriskt fel: **Ledarskaps-panelen är för transienta nudges** (sänk tempo · privat samtal · offentlig beröm — engångshandlingar med cooldown). Mentorskap är ett **bestående arrangemang**. Att blanda in ett arrangemang bland nudges är ett kategorifel.

**PC-6 förloras inte:** konsekvensen (utvecklingsbonus) finns redan i system 2 (developmentRate + confidence). PC-6 gjorde ett redundant system läsbart; när systemet klipps är arbetet överspelat, inte kastat värde.

**~~Veto/alternativ~~ — AVGJORT (Jacob 2026-06-20):** klipp står. Ledarskaps-panelen ska inte bära ett bestående arrangemang. Affordansen räddas INTE via deep-link från spelarkortet — veteran→ung-fantasin räddas i stället genom system 2:s vidgade adept-behörighet (se C). Ett system, en yta, men fantasin lever.

---

## (A) CODE — klipp System 1

En fil i taget, verifiera per steg.

1. **`src/domain/services/leadershipService.ts`:** ta bort `'mentor'` ur `LeadershipAction`-typen, ur `COOLDOWNS`, och hela `case 'mentor':` i `applyLeadershipAction`. Kvar: `lower_tempo` · `private_talk` · `public_praise`.
2. **`src/presentation/components/PlayerCard.tsx`:** ta bort `{ id: 'mentor', label: '🎓 Sätt som mentor' }` ur Ledarskaps-knapparnas array (4→3). Gridet är 2-kol → blir 2+1. Om den ensamma raden ser obalanserad ut: låt Design-Fable titta, men bygg först med 3.
3. **`src/domain/services/playerDevelopmentService.ts`:** hitta och ta bort MENTOR_CA_BONUS-läsningen (PC-6) — bonusen som appliceras när en `leadershipActions`-entry har `action==='mentor'` + `mentoredPlayerId`. Grep `MENTOR` + `mentoredPlayerId` för alla läsare.
4. **Verifiera döda referenser:** grep `'mentor'` (action-strängen), `mentoredPlayerId`, `MENTOR_CA_BONUS`, `getActiveLeadershipAction`. Befintliga `leadershipActions`-entries med `action:'mentor'` i gamla saves blir inerta (expirerar) — ingen migration krävs, men bekräfta att inget kraschar på dem.

**Gate:** typecheck + tester gröna. Bekräfta att Ledarskaps-panelen har tre knappar och att mentorskap finns ENBART i Akademi-fliken.

---

## (B) Förb 5 yta E — mentorskaps-konsekvensrad (Opus-text, klar)

Konsekvensraden bor i Akademins Mentorskap-kort: en MB-rad som säger vad paringen gör. Två lägen — **preview** (vald men ej tilldelad) och **aktiv** (befintlig paring). Honorera mekaniken ärligt: disciplin skalar dragkraften, form ≥40 är grinden.

**Pool SKRIVEN av Opus:** `src/domain/data/mentorshipStrings.ts` finns nu i repot (tre exports nedan). Code skapar INGEN text — wirar bara helpern.

```ts
// Preview: båda valda i dropdownsen, före Tilldela.
export function mentorshipPreview(seniorName: string, disciplin: number, juniorName: string): string {
  if (disciplin >= 80) return `${seniorName} håller hård disciplin. ${juniorName} skulle dra fördel snabbt — så länge ${seniorName} själv håller formen.`
  return `${seniorName} går före med ordning och reda. ${juniorName} lyfter stadigt med en rutinare bredvid sig — när formen finns där.`
}

// Aktiv: befintlig paring, mentorn I form (effekten går).
export function mentorshipActiveInForm(mentorName: string, disciplin: number, adeptName: string): string {
  if (disciplin >= 80) return `${mentorName} går före med disciplin. ${adeptName} snappar upp det — utvecklingen lyfter, märks om några omgångar.`
  return `${mentorName} visar ${adeptName} hur man sköter sig. Stadig dragkraft, inget mirakel — men det lutar rätt väg.`
}

// Aktiv: mentorn UR form (<40) — grinden gjord läsbar (promise↔konsekvens).
export function mentorshipActiveOutOfForm(mentorName: string, adeptName: string): string {
  return `${mentorName} är för dåligt däckad själv för att föregå med exempel just nu. ${adeptName} står stilla tills formen kommer tillbaka.`
}
```

**Wiring (Code):**
- Aktiv paring-raden i AkademiTab: under varje "{mentor} → {adept}", rendera `mentor.form >= 40 ? mentorshipActiveInForm(...) : mentorshipActiveOutOfForm(...)` som kursiv MB-rad (samma typografi som övriga konsekvensrader: `font-display`, italic, `text-secondary`, ~10.5px).
- Preview-raden: när `selectedMentorSeniorId` OCH `selectedMentorYouthId` är satta (före Tilldela), rendera `mentorshipPreview(...)` under dropdown-raden.

---

## (C) PROMISE↔KONSEKVENS-FIX (Code, hör ihop med kanon)

> **STATUS 2026-06-20: BYGGT ÅT FEL HÅLL — REVERSERING KRÄVS.** Code begränsade `youthForMentor` till P19 (min gamla (a)-rekommendation, `5e80c9ed`-passet) — tvärtemot det ratificerade beslutet att VIDGA. Veteran→ung A-spelare är därmed borttagen. **Fristående körorder: `docs/CODE_FIX_MENTORSKAP_C_REVERSERING_2026-06-20.md`** (mekanik + hook nedan sammanfattad).

**Bräckt löfte (ursprungsdiagnos):** `youthProcessor`-effektloopen uppdaterar bara `youthTeam.players` (P19). En mentor tilldelad en A-lagsspelare gjorde ingenting. Beslutet: **stäng gapet genom att VIDGA effekten, inte genom att smalna av urvalet.**

**BESLUT (Jacob 2026-06-20): VIDGA, inte begränsa.** Veteran→ung A-spelare ska leva — så fixen är att UTÖKA effekten till adepterna UI:t tillåter, inte att smalna av urvalet. (Ersätter min tidigare (a)-rekommendation att begränsa till P19 — Jacob valde behålla veteran→ung, vilket gör vidgningen rätt väg.)

**REVERSERING (Code) — återställ det `5e80c9ed` tog bort, åt rätt håll:**
1. **`youthForMentor` (AkademiTab):** återställ A-trupps-grenen, men **ålder-baserad U22**, inte `promotedFromAcademy`-flaggan: `managedPlayers.filter(p => p.age <= 21)` (uteslut den valda mentorn själv + redan tilldelade adepter), label "(A-lag)". P19-grenen står kvar. Trivialt.
2. **Effekten — BEKRÄFTAD mekanik, ingen ny behövs:** `developmentRate` konsumeras för unga A-spelare i `calculateRoundDevelopment` (`applyRoundDevelopment`): ålder≤20 → `+devRate/500`, ålder≤23 → `+devRate/800`. Så en developmentRate-bump på en A-trupps-U22-adept ger verklig CA-växt.
3. **PLUGGNINGEN (knuten som gjorde restrict frestande):** `youthProcessor`:s mentor-loop uppdaterar bara `youthTeam.players`, inte `game.players`. A-trupps-adeptens developmentRate-bump måste därför appliceras i **players-uppdateringsvägen** (round-processorn där `applyRoundDevelopment` kör), inte i youthProcessor. Spegla P19-logiken: per omgång, gated `mentor.form >= MENTOR_FORM_THRESHOLD`, `devBoost = mentor.discipline / 20`, adeptens `developmentRate += devBoost * 0.1`. Code: hitta call-siten för `applyRoundDevelopment` och applicera mentor-bumpen på A-trupps-adepter där (P19-adepter fortsätter via youthProcessor oförändrat).
4. **Adept-back-ref (Fable flaggade):** `YouthPlayer.mentorId` finns bara på ungdomsspelare. För A-trupps-U22-adepter härleds adept-sidan ur `mentorships.find(m => m.youthPlayerId === player.id)`. Båda adept-typerna ska läsa likadant på kortet (= läsbarhetsordern).

Promise↔konsekvens hålls genom att effekten faktiskt täcker alla adept-typer UI:t tillåter — inte genom att kapa urvalet.

---

## (D) DESIGN-FABLE — läsbarhetsbrief: LEVERERAD 2026-06-20

Fable har skrivit briefen: `docs/incoming/DESIGN-BRIEF-MENTORSKAP-LASBARHET-2026-06-20.md` (+ renderad `Mentorskap - lasbarhet (brief).html`). Ligger i incoming — fila till `docs/` + `docs/mockups/` när incoming-genomgången når den (live brief, ej dup).

Briefen låser läsbarheten, allt ur befintliga fält (`mentorships`, `mentorId`, `startRound`, formgrinden — ingen ny domänmodell):
- **Spelarkortet (RELATIONER, överst):** adept → "Mentoreras av {mentor} · sedan omg {startRound}" + kvalitativ effektläsning; mentor → "Mentor åt {adept}" + 🎓-trait-tagg. Effekt KVALITATIVT ("växer snabbare"), aldrig rått tal.
- **Vilande tillstånd (bärande insikten):** form < 40 pausar mentorskapet. Gör vilan till ett tydligt tillstånd — Aktiv/Vilar-pill (cold/blå, ingen ny färg), "pausad tills formen kommer tillbaka". Det ger veteranens formsvacka en *andra tyngd* (en skör mentor är opålitlig) → gör "vem mentorerar" till ett riktigt vad-om. UI läser samma form≥40-tröskel som motorn.
- **Akademi-fliken:** berika paret med samma bond-vokabulär (pill + sedan-omg + effektläsning); "välj ung"-listan vidgas till A-trupps-U22 (= C).

Code bygger läsbarheten EFTER (A)–(C). Knyter direkt an till yta E (B) — samma form-grind, samma kvalitativa röst.

**Implementeringsorder SKRIVEN:** `docs/CODE_MENTORSKAP_LASBARHET_2026-06-20.md` — vänder Fables design-brief till byggsteg (Steg 0: extrahera `MENTOR_FORM_THRESHOLD`; Yta 1: RELATIONER-band på PlayerCard; Yta 2: 🎓-trait; Yta 3: berikad AkademiTab = (B)). Bond-strängarna (`mentorshipBondAdeptInForm/Resting`) tillagda i `mentorshipStrings.ts`.

---

## Sekvens
1. (A) klipp system 1 + (C) vidga adept till A-trupps-U22 → Code (samma pass, båda rör mekaniken). (C) ÄR keep-veteran→ung.
2. (B) yta E-text → Opus klar (`mentorshipStrings.ts` i repot); Code wirar i samma pass.
3. (D) läsbarhet → Fable-brief LEVERERAD (incoming); Code bygger efter (A)–(C).
