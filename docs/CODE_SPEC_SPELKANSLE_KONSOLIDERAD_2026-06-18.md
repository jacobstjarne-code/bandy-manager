# CODE-SPEC — Spelkänsla, konsoliderad

**Av:** Opus · **För:** Code · **Datum:** 2026-06-18

**Källor reconcilade:**
- `SPELKANSLE-RAPPORT-KONSOLIDERAD-2026-06-14.md` — **EMPIRISK**, två hela säsonger spelade (Jacob+Fable), build `678bf5d`. Detta är marken.
- `incoming/Spelkansle-genomgang I/II ...html` — Fable mockup-analys (06-17), gjord efter men mindre förankrad.
- `DECISIONS.md` 2026-06-18 (fanMood) · `BACKLOG.md` KF-sektionen · de två REVIEW-SPELKANSLE-doken (06-17).

---

## STATUS 2026-06-18 (efter verify-mot-HEAD — läs FÖRE allt nedan)

Code körde §A-regeln (verifiera mot HEAD). Resultat: **§A var till största delen redan byggd denna session.** R3/C1-kurering (`3ff48bc` + `8b7289fb`), BUG-1..6 (`c5e752e` / `f542abe` / `fcb0c3b`), C2 notis-diet (`f459b71`), delade primitiver + HIDDEN_PATHS + globala svep + lagfoto/scoreboard/pitch (A/B/C-bågen). §F (B1-closeout) klar. **§C1 LÖST:** klack 8a är byggd OCH verifierad-rörlig (`e560c97` + `verify-klack-reaction.ts`) → den parkerade mätaren spelaren såg ÄR fanMood, inte klacken. Verifieringsfrågan i §C punkt 1 är därmed besvarad.

**Genuint kvar för Code = §B (fanMood / kartfynd 8b)** — beslutat (DECISIONS 2026-06-18), avgränsat, mekanik specad. Allt annat i §A/§C nedan är historik; behåll för spårbarhet men bygg inte om. §D (gated) + §E (Opus-copy) står kvar som de är.

---

## 0. RECONCILIATION — läs först, annars bygger vi fel

Den spelade rapporten vinner över mockup-analysen där de krockar. Tre avgöranden:

1. **Död mittsäsong = FALSIFIERAD.** Rapporten DEL D§1: ingen död zon — mitten är *tätast* (kaptenval → annandag → sponsor → akademi → nemesis → VM → burnout). → **Genomgång I omdesign A (andningsrad mot tomhet) BYGGS INTE.** Premissen finns inte. Det verkliga mittsäsongsproblemet är motsatsen — för mycket staplat (rapportens C3) — och fixen är avbrottsbudgeten (§D), inte att fylla tomhet.
2. **Genomgång I omdesign C (slå ihop puls + fanMood) = NEDLAGD.** Per DECISIONS 2026-06-18: Jacob vill ha egna mätare. fanMood byggs upp i stället (§B).
3. **Vilken mätare såg död ut är OKLART mellan doken.** Rapporten DEL D§3: *klack-mood* parkerat på 60 hela säsong 1. Genomgångens mock: *fanMood* på 92. → verifiera i kod/spel vilken mätare som faktiskt stod still innan vi antar att fanMood-fixen räcker (§C).

---

## A. BYGG NU — Code (prioriterat ur rapportens DEL G + Genomgång II)

> Verifiera nuläge mot HEAD först — rapporten är build `678bf5d` (06-14), vi är 06-18 och B1-rundan har landat sedan dess. Vissa buggar kan vara åtgärdade. Kolla innan fix.

| Prio | Vad | Var / hur | Verifiera |
|------|-----|-----------|-----------|
| 1 🟥 | **R3 endgame-kurering** — hård-dölj icke-match-kort i slutspel/avgörande (rapportens enskilt största fynd: semifinal under 0–2, portalen bjöd sponsorbastu + journalist + nemesis + burnout). | R3-handoffen specade hård borttagning som aldrig byggdes. Portal-byggaren (`portalBuilder.ts`/`inboxToPortal.ts`) ska i endgame-fas (slutspel, omg ≥20, säsong 2-start) HÅRD-dölja allt som inte är matchen — inte dämpa vikt. | Slutspelsportal under press = EN sak: matchen. |
| 2 🟥 | **Rund-text + Fokusera auto-rensas vid playoff-rundövergång** (BUG-3,4: semifinal visade "Kvartsfinalen…", Fokusera-kortet följde med KF→SF). | Rund-specifik beat saknar auto-rensning vid rundövergång. Samma mekanism för båda → en fix. | KF-text/Fokusera släckt på SF. |
| 3 🟥 | **Straffresultat → live-tavla** (BUG-1: live-tavlan visade "5–5 · FT" utan straffindikator; Granska visade rätt "Straffar 3–1"). | Straffvinnaren propageras till summary men aldrig till live-matchstate/scoreboard. Lägg scoreboard-rad + propagering. | Cup-straffmatch: live-tavlan visar straffutfall. |
| 4 🟥 | **Säsong 2-start svart portal** (BUG-2: renderas svart/blackad, innehåll i spök-opacity). | Transition/overlay fastnar mid-fade. Samma kontrast-klass som Minne-fliken hade (fixad där) — applicera samma fix. | Säsong 2-start renderar synligt. |
| 5 🟥 | **Minnesgeneratorn** (BUG-5,6, samma yta → en fix): (a) fel rund-etikett ("Cupfinalen förlorades" när laget åkte ut i semi); (b) spöksäsonger 2022–25 renderas före karriärstart med "Inga händelser". | Minnesgeneratorns rund-etikett + säsongsfilter (rendera inte säsonger före spelarens start). | Rätt rund-namn; inga pre-start-säsonger. |
| 6 🟥 | **Notis-diet** (C2: 51 olästa omg 16, 59 vid säsong 2-start). | Aggregera träningsrapporter → en rad; inga egna matchresultat i inkorgen (delvis A1 redan); **nollställ/gallra vid säsongsskifte**. Severity-dots + grupper finns redan ✓. | Inkorg hanterbar vid säsong 2-start. |
| 7 🟧 | **Delade primitiver + naven** (rapport prio 7 + Genomgång II C/D): delad **TabBar → 2-rad wrap + befintlig dot-prop** (löser Klubb 6 + Övergångar 5 + framtida i en komponentfix); `positionLabel`-strata → `domain/format` (MV/B/YH/MF/A-kanon, per DECISIONS 2026-06-14); `tkr/mån`-formatter heltal (regel 11); severity-skala. **Klubb-vylängd: sektions-kollaps "Visa allt →", INTE fler flikar** (redan 6). | Lokalisera delad TabBar (Klubb + Övergångar läser den). Tvåradig wrap skalar till ~7 piller — bortom det är problemet för många mål, inte wrap. | Klubb/Övergångar: alla flikar nåbara utan klipp. |
| 8 🟧 | **HIDDEN_PATHS-svep** — dölj BottomNav på ALLA ceremoni-/scen-ytor (Gagnef-laddning, Annandagen, derby, alla slutspels-scener). | `HIDDEN_PATHS` i BottomNav.tsx — lägg till de saknade ceremoni-routes. | Ingen BottomNav på scen-/ceremoni-ytor. |
| 9 🟧 | **Globala svep**: emoji→Lucide (✨🎥⚡📰🔄💾📁💡📌 + 🎯/🤝/🏆 modal-heron); disabled-state B8 (oläslig beige); gold→copper (hattrick-milstolpar, DB-2-inflation); tomma kort (FORM-rad, snittbetyg, fornsäsonger). | Rapportens mönster: det som krävde EN komponent blev rätt; globala svep sitter bara där route:n rörts. Gör svepen globalt nu, inte route-för-route. | — |
| 10 🟧 | **Lagfoto overflow** (BUG-8, klipps i högerkant >394px); **scoreboard-redundans** (score+tid på både LED-tavla OCH intensitetsbar — stryk ur intensitetsraden); **taktik-pitch-kontrast** (is-yta ≈ papper). | Telefonbredd 375–430px. | — |

**Genomgång II — A spelarkort:** omgruppera 14 sektioner → 3 etiketterade lägen + lyft röst/känsloläge till toppen + **porträtt-wiring**: mappa spelarens ålder/karriärstadie → tier (`young/mid/exp/vet`) → seedat val 1..8 mot de 32 befintliga `public/assets/portraits/portrait_*_N.png`, ersätt den procedurella `svgPortraitService`-vägen, **städa stale `@deprecated`-stub i `portraitService.ts`** ("PNG assets don't exist" är fel — de finns). Copy = Opus-lane.

**Genomgång II — B taktik:** avstapling till ETT spelstil-segment delat med matchförberedelsen. **Bekräfta först att det blir EN kanonisk taktik-store** (inte tre med samma etikett) — se §C.

---

## B. fanMood (KF8) — egen mätare till orten-paritet

Per DECISIONS 2026-06-18. fanMood är en schablon; ge den pulsens behandling. **Spegla `communityStanding` (pulsen), som löste detta empiriskt** — gissa inte nya siffror.

1. **`narrativeProcessor.ts`** (fanMood-beräkningen): (a) lägg diminishing returns på POSITIV `fanDelta` — spegla communityProcessor: `>85 ×0.25`, `>70 ×0.5`, `>55 ×0.75`, negativa opåverkade. (b) Oavgjort-deltat **+1 → 0** (uppåtbiasen bort).
2. **`roundProcessor.ts`** (där communityStanding-driften bor, "Sprint 26"): lägg en parallell **fanMood-drift mot 50 med 3 %/omgång** (`DRIFT_TARGET = 50`, `DRIFT_STRENGTH = 0.03`), tillämpad INNAN match-/transfer-deltan så de aktivt motverkar driften — exakt mönstret pulsen redan har.
3. **Kalibrering:** starta på pulsens beprövade kurva (mål 50 i st f pulsens 60). Reversion + diminishing fixar parkeringen rapporten såg. Finjustera mot NÄSTA genomspelning — gissa inte vidare.

Klacken (kartfynd 8a, `supporterGroup.mood`) är redan byggd och ändras inte här. Detta gäller fanMood (8b).

---

## C. VERIFIERA FÖRST (innan §B/§A-B antas räcka)

1. **Vilken mätare stod parkerad i spel?** Rapporten DEL D§3 såg *klack-mood* på 60 hela säsong 1. Men `klackMoodDelta` (kartfynd 8a) ÄR byggd i `communityProcessor` (derby dubbelviktat) och appliceras i `roundProcessor` via `adjustSupporterMood`. Trace: fyrar `klackMoodDelta` faktiskt med utfall ≠ 0? Når den den mätare UI:t visar? **Om klacken är den döda spelaren såg räcker INTE fanMood-fixen** — då har 8a en wiring-/magnitud-lucka som är den egentliga buggen. Avgör detta innan §B betraktas som hela svaret.
2. **Genomgång II B:** bekräfta att taktik bor i EN kanonisk store innan avstaplingen (rapportens/genomgångens "tre ställen utan sanningskälla").
3. **Genomgång II A säsongsbåge:** bekräfta att loggen bär formkurva/kapten-sedan-omg/resultat innan raden skrivs (lärdom #9 — hävda bara det datan bär).

### VERIFIERAT 2026-06-18 (Opus, mot koden) — A/B är byggbara ur befintlig mock

- **C2 taktik-store LÖST.** EN kanonisk `Tactic`-typ på `Club` + en delad options-definition (`tacticData.tacticRows`). Taktiktavlan (`TaktikScreen`) skriver via `gameStore.updateTactic` → `club.tactic`. Matchförberedelsen (`TacticStep`) är en **kontrollerad vy** (props `tacticState` + `onChange`), inte en egen store. De "tre ställena" är tre editorer av EN form, inte tre sanningskällor. → B:s avstapling är en UI-konsolidering ovanpå `club.tactic`, låg arkitekturrisk. Enda kvarvarande detalj: bekräfta att matchförberedelsens `onChange` committar till `club.tactic` (vs ett utkast till matchstart) — wiring-detalj Code löser under bygget, ej blockerare.
- **Kemi-overlay: data redan framdragen.** `TaktikScreen` skickar `game.chemistryStats` in i `TacticBoardCard`. Overlay:n ritar kanter ur den — data-backad ✓.
- **C3 säsongsbåge:** `scoreSnapshots` loggar form/position över säsongen (systemkarta §5). Code bekräftar exakta fält och trimmar raden till det loggen bär — form + resultat säkert; "kapten sedan"/"laget följer honom" bara om captaincy-logg finns, annars stryk (lärdom #9).
- **Porträtt (A):** mekanisk wiring — 32 assets finns i `public/assets/portraits`, mappning ålder/karriär→tier→seedat val. Ingen ny pipeline, ingen ny mock.

**Slutsats:** ingen ny mock krävs. Genomgången är feel-mocken; koden bär datan. A = omgruppering + porträtt + trimmad båge-rad. B = avstapling på `club.tactic` + kemi-overlay. Båda → Code.

---

## D. GATED — bygg INTE förrän grinden släpper

- **Avbrottsbudget över alla kanaler** (= rapport C3/prio 8 = KF3 = Genomgång I omdesign B "Veckans bord"). Detta är det VERKLIGA mittsäsongsarbetet, inte omdesign A. `interruptClassifier` (byggt 05-21) måste wiras + **policybeslut**: budget gallrar BESLUT (kapten/sponsor/annandag/akademi), INTE narrativa band (efterklang/kafeteria/journalist). Blockerad på classifier-wiring + Jacobs/ditt policybeslut. Korsas mot rapportens C3-logg.
- **Genomgång II kemi-overlay + "så spelar det"-rad:** bekräfta att kemimodellen avger par-/positionsvärden först.
- **Genomgång I omdesign A:** NEDLAGD (premiss falsifierad) — ej gated, borttagen.

---

## E. OPUS-LANE — copy, INTE Code

Code rör inte dessa strängar; Opus levererar direkt:
- Burnout-eskaleringspool (loopar 6+ ggr — ska eskalera mot säsongsslut, inte upprepa).
- "Vänder ur. Och vänder ur."-dubbleringen (BUG-7 — verifiera om mall-bugg eller copy).
- "Lite hawaii över detta" → bandysvensk understatement.
- Pressrubrik unik per yta (Portal/Inkorg/Media visar samma).
- Match-laddning: villkora bort "det som hände i höstas" säsong 1.
- Anteckningar: fler varianter ("Albin vill spela mer…" upprepas ordagrant).
- Spelarkortets röst/andningsrad + ev. nya pooler.

---

## F. SEPARAT — egen order, ej här

`docs/BESTALLNING_CODE_B1_CLOSEOUT_2026-06-17.md` körs fristående (§5 migration/utfasning, capacityBonus, C1, Valet-ingång, financing-kalibrering). Rör inte fanMood/naven.

---

## G. ARBETSREGLER

- **Verifiera nuläge mot HEAD först** — build `678bf5d` är 06-14; somliga buggar kan vara borta.
- **Render-flödesregeln:** läs förälder-screen, spåra hela render-flödet, verifiera "renderas rätt i kontext" — aldrig komponent i isolering. Visa kod, inte slutsats.
- En commit per huvudpunkt; titel matchar diff; hash + faktiskt innehåll i redovisningen.
- Visuella: pixel-jämför mot mock, skärmdump i commit.
- Pensionsval-etikett (rapport DEL E, 🟧 design): en primär etikett + mono-konsekvensrad (bastu-modalen är mallen) — designfix, ej copy.

— Opus, 2026-06-18
