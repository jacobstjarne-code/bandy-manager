# DESIGNOMGÅNGEN KOMPLETT — Visuell-konsekvens-audit, build 050bb22
**Sammanställd:** 2026-06-11 · **Design (Fable)**

Hela omgången i ett dokument: 14 del-audits (kapitel 1–14), den konsoliderade försoningskartan (kapitel 15) och designslutsatserna/steg 3 (kapitel 16). Systempatchen som följde av detta ligger i `DESIGN-DECISIONS.md` § "Systempatch 2026-06-11"; arbetsordern i `handoffs/RELA-FORSONINGSSPRINT-2026-06-11.md`.

## Innehåll
1. Onboarding → Portal 1
2. Förbered-flödet (1-2-3)
3. Match live → Halvtid → Granska
4. Granska-flikar · Helgen-beat · Portal 2
5. Beats · Kommentar-läge · Kafeterian
6. Toppnav (Spelguide · Inkorg · Meny)
7. Trupp (NU · TRUPP · TAKTIK)
8. Tabell (TABELL · STATISTIK · CUPEN)
9. Transfers (5 flikar)
10. Klubb (6 flikar)
11. Spelarmodal · Snabbsim · In-match
12. Omg 5 — derby · data-fyllda vyer
13. Taktik-flikar · Inbox · Slutspel → SM-final
14. SM-guld → säsongsskarv → 2027/28
15. FÖRSONINGSKARTAN (konsoliderad)
16. DESIGNSLUTSATSER (är designen rätt?)



---

# KAPITEL 1

# AUDIT — Visuell konsekvens · Del 1: Onboarding → Portal 1

**Build:** 050bb22 · **Datum:** 2026-06-10
**Brief:** `DESIGN-BRIEF-VISUELL-KONSEKVENS-FABLE-2026-06-10.md`
**Subjekt:** 6 as-built-screens (intro · namn · tre samtal · klubbkarta · ankomst · Portal omg 1)
**Format:** stratum / avvikelse mot standard-rad / försoning / prio. Redesign-impulser separat i §9.

---

## 0 · Verifierat rent (mät-baslinje)

- ✅ **Säsongsetikett "Jacob · 2026/27"** i Portal-masthead — 4051/52-buggen är borta i denna build.
- ✅ **Scen-vokabulären håller ihop:** ⬩-eyebrows (TRE SAMTAL / ANKOMSTEN), Georgia-scenrubriker, kursiv-ingresser — intro→ankomst läser som samma ceremoniella familj.
- ✅ **Illustrations-domänregeln respekterad:** bild vid ögonblick (intro, ankomst) — inte i vardagsytor.
- ✅ **En primär per skärm** håller hela flödet (Portal: Acceptera fylld, Kräv mer/Avslå outline — korrekt).
- ✅ **Georgia-numeraler** (KONDITION/FORM/KASSA), copper-underline-header, lucide BottomNav med korrekt aktiv-vikt.

---

## 1 · 🟨 BURY FEN = avsiktlig studio-signatur — README-drift, inte app-drift

**OMKLASSAT efter Jacobs besked:** Bury Fen är studio-märket ("Bury Fen presenterar"-känsla, animeras in) — inte en deprecated logga i fel kontext. Rätt referens dessutom (bandyns födelseplats).

| | |
|---|---|
| **Kvarstående fynd** | README §App icons kallar `buryfen-logo.png` "deprecated alt logo" — **dokumentet ljuger om ett levande brand-element.** Ratificera studio-rollen i DESIGN-DECISIONS + README |
| **Designnot** | Som studio-mark hör den hemma på EN plats: intro-splashen (animeras in, à la förlagsvinjett). På namn-skärmens footer blir den brus — vinjetter upprepas inte mitt i flödet. Om den ska stå kvar där: gör den till diskret "BURY FEN"-textmark, inte logga |
| **Prio** | 🟨 dokument + en placeringfråga |

## 2 · 🟥 CTA-radie: pill vs ratificerad 12px

| | |
|---|---|
| **Var** | "STARTA KARRIÄREN", "GÅ VIDARE →", "SÄTT IGÅNG →" — alla onboarding-CTA är 99px-pills |
| **Stratum** | Onboarding-generationens egen knapp — föregår `.btn-cta`-kanon |
| **Avvikelse** | Corner radii-tabellen: `.btn-cta` = **12px**. Pill (99px) är reserverat för `.tag`. Portal-CTA:n ("SPELA CUP-KVARTSFINAL") ser ut att följa kanon — så appen har idag TVÅ CTA-former beroende på ålder på skärmen |
| **Försoning** | Byt onboarding-CTA till `.btn-cta` rakt av (12px, copper-gradient, sheen). Ingen ny variant |
| **Prio** | **Bryter helheten** — CTA är den mest repeterade formen i spelet; två former = två system |

## 3 · 🟧 Disabled-CTA på namn-skärmen — okänd state utan kontrast

| | |
|---|---|
| **Var** | "GÅ VIDARE →" före namninmatning: urtvättad beige-rosa pill med vit text |
| **Stratum** | Ad-hoc disabled-state — ingen ratificerad disabled-token finns |
| **Avvikelse** | Vit text på ljus beige ≈ ingen kontrast; färgen läser som en FJÄRDE copper-variant utanför accent/dark/deep. DESIGN-DECISIONS har ingen disabled-regel → systemlucka (kalibrerings-fynd, inte bara drift) |
| **Försoning** | Kortsiktigt: `--accent` @ etablerad låg-alpha + `--text-light`-på-mörk eller behåll fylld men sänk hela knappen i opacity (en mekanism, inte en ny färg). Långsiktigt: ratificera EN disabled-regel i DESIGN-DECISIONS |
| **Prio** | Bryter helheten (läsbarhet) + **systemlucka** |

## 4 · 🟧 Svårighets-taggar (SVÅR/MEDEL/LÄTT) — form- och token-drift

| | |
|---|---|
| **Var** | "Tre klubbar har ringt"-korten |
| **Stratum** | Egen tag-variant — föregår tag-kanon |
| **Avvikelse** | (a) Form: rektangulär ~4px-radie-outline, men `.tag` = 99px pill per radii-tabellen. (b) Färg: MEDEL är gul-guld — `--warning` ÄR copper (#C47A3A) per tokens; den gula ser ut som `--led-warn`-läckage eller rå hex. LED-paletten är "reserved exclusively for the scoreboard" (README §Palette) |
| **Försoning** | `.tag`-pill med 10–15%-alpha-bakgrund: SVÅR → `--danger`, LÄTT → `--success`, MEDEL → `--warning` (copper). Noll nya färger |
| **Prio** | Kosmetiskt-plus — tydlig token-överträdelse men liten yta, ses en gång per karriär |

## 5 · 🟧 "NEUTRAL PLAN" dubbleras i NextMatchCard

| | |
|---|---|
| **Var** | Portal omg 1, cup-kortet: pill uppe höger OCH samma text i tagraden under lagen |
| **Stratum** | Wiring-överlapp (två generationer av samma metadata) |
| **Avvikelse** | "Tight, not airy" + content-regeln (varje element förtjänar sin plats) — samma fakta två gånger i samma kort |
| **Försoning** | En plats: behåll i tagraden (där EN MATCH AVGÖR + DIREKTKVAL bor), släpp hörn-pillen. Eller tvärtom — men EN |
| **Prio** | Kosmetiskt, men i spelets mest sedda kort |

## 6 · 🟨 FORM-raden i NextMatchCard ser halvtom ut

"FORM" -label vänster, ensam grön ruta + "vs" höger — raden upptar full höjd för nästan inget innehåll (omg 1 = ingen historik). Samma mönster som sparkline-fallback-regeln (handoff 05-31): **< MIN_POINTS → visa status-rad, inte tom struktur**. Försoning: göm FORM-raden tills ≥2 matcher spelade. Prio: kosmetiskt (självläker omg 3+, men varje ny karriär börjar här).

## 7 · 🟨 📌-emoji utanför den låsta kartan

"Styrelsens krav"-rader (ankomst + portal) använder 📌 per rad. Den fasta emoji-kartan (README §Emoji, "Don't invent new emoji") saknar 📌 — närmast är 🎯/📋. Sektionsetiketten verkar redan använda 🎯; rad-📌 är dekorativ dubblering. Försoning: släpp rad-emojin (etiketten bär kategorin) eller använd 📋. Prio: kosmetiskt.

## 8 · 🟨 README-drift (kalibrerings-fynd, instrumentet själv)

- **Tagline:** README: *"Upplev atmosfären av svensk elitbandy."* Appen: **"En ort. Ett lag. Ett mål."** — bättre copy, men kanon-dokumentet säger annat. Ratificera den nya i DESIGN-DECISIONS + uppdatera README.
- **Intro-bakgrund:** README §Imagery: "No photography beyond intro-bg.jpg (871×1080 floodlit arena)" — ersatt av målad illustration (rätt beslut, illustrationssystemet) men README-raden är inaktuell, och "No illustration systems" i samma stycke motsäger numera hela illustrationskanon.
- Tidigare kända: 8px-section-label, 36px-score (redan flaggade i briefen).

## 9 · Utanför scope — redesign-impulser (flaggas separat, ej i kartan)

1. **Namn-skärmens ljusa mellanspel.** Sekvensen går mörk→LJUS→mörk→mörk. Kan läsas som blankett-metafor (papper att fylla i — liggar-släkt), men idag är skärmen för tom för att bära metaforen. Om den behålls ljus: ge den blankett-DNA (linjering/marginal à la LedgerFrame-papper). Beslutsfråga, inte drift.
2. **"Visa alla 12 klubbar"-länken** är naken text-underline — enda stället i flödet utan chevron/knapp-vokabulär. Liten.
3. **Klubbkartans Sverige-silhuett** är så svag att den läser som en fläck snarare än karta. Antingen tydligare (tunn linje-kontur, 70-tals skolplansch-stil = Princip 3) eller bort. Kvalitetsfråga.

---

## Rangordnad försoningslista

| # | Fynd | Prio |
|---|------|------|
| 1 | Onboarding-CTA → `.btn-cta` 12px | 🟥 helhet |
| 2 | BURY FEN: ratificera studio-roll i README/DESIGN-DECISIONS; vinjett endast på intro | 🟨 dokument/placering |
| 3 | Disabled-CTA-regel ratificeras + namn-skärm fixas | 🟧 helhet + systemlucka |
| 4 | Svårighets-taggar → `.tag`-pill + tokens (gul bort) | 🟧 token |
| 5 | NEUTRAL PLAN-dubblett → en plats | 🟧 kosmetiskt/hög synlighet |
| 6 | FORM-rad göms < 2 matcher | 🟨 |
| 7 | 📌 → bort/📋 | 🟨 |
| 8 | README-drift: tagline + intro-bg/illustration-raderna | 🟨 dokument |

**Systemluckor hittade (matas till steg 3-genomgången):** disabled-state-regel saknas · tag-semantik för svårighetsgrad saknas (LÄTT/MEDEL/SVÅR är ny kategori) · README §Imagery föråldrad som helhet · studio-brand (Bury Fen) odokumenterat som levande element.

— Design-Claude (Fable), del 1 av försoningskartan


---

# KAPITEL 2

# AUDIT — Visuell konsekvens · Del 2: Förbered-flödet (1-2-3) → Spela matchen

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 5 as-built-screens (Välj trupp Lista ×2 · Plan · Välj taktik · Starta)

---

## ⓪ · 🟥🟥 META-FYND: Greenlit design EJ i build — rapporterad som klar

**LedgerFrame-Förbered (godkänd, "går till Code" per Opus 06-09) finns inte i 050bb22.** Ingen masthead-på-papper, ingen RPS-strip i liggar-form, inga Trupp|Taktik-tabbar, ingen stämpel — legacy-wizarden (1-2-3-cirklar, Lista/Plan-segment) är live. Samtidigt har Opus rapporterat implementationen som gjord.

**Åtgärd före allt annat:** Code redovisar vilken commit som påstods innehålla LedgerFrame-wiringen och vad den faktiskt rörde. Antingen ligger den på en annan branch, eller så är rapporten fel. Tills det är rett: **alla wizard-kosmetiska fynd nedan är "ersätts av greenlit design — fixa inte, ersätt"** (markerade ⤳LF). Jag auditerar dem ändå — de visar var legacy-strata ligger, och vissa fynd (disabled-state, emoji, semantik) överlever in i nya designen.

---

## 0 · Verifierat rent

- ✅ "Jacob · 2026/27" ✓ · Georgia-numeraler i spelarlistan (52/64/71…) ✓ · positionsgrupp-etiketter (MÅLVAKTER/BACKAR/…) korrekt letterspaced ✓
- ✅ En primär per skärm hela vägen — tillbaka-knappar är outline, CTA copper ✓
- ✅ Scout-budget-dots (●●●●) i Motståndaren-kortet = samma vokabulär som Transfers ✓
- ✅ Taktik-stegets rekommendations-legend ("• = rekommenderat val") finns ✓
- ✅ Starta-stegets hero ärver valen ("Taktik: Högt tempo · Offensivt" + pep-citat) — bra informationsarv mellan steg ✓
- ✅ START-taggar i `.tag-green`-mönster, validerings-banner i danger-familjen ✓

## 1 · 🟥 RPS-stripens semantik är fel — SPELA aktiv under Förbered

Hela trupp/taktik/starta-wizarden ÄR Förbered-fasen, men strippen visar **⊘ FÖRBERED — ◉ SPELA — ○ GRANSKA** (Förbered överstruken, Spela aktiv). Dubbelfel: (a) fel fas markerad aktiv; (b) ⊘-glyfen läser som "förbjuden/blockerad", inte "avklarad" — kanon är ✓ för klar, ⬡/◉ för aktiv. Spelaren får lära sig att fasmodellen inte betyder något. **Försoning:** ✓/⬡-vokabulären ur LedgerFrame-kanon + korrekt fas-mappning (wizard = FÖRBERED aktiv). Prio: bryter helheten — det här är fasmodellens ansikte.

## 2 · 🟧 Disabled-CTA-stratat återkommer (bekräftar Del 1 §3)

"NÄSTA: TAKTIK →" disabled = samma urtvättade beige med vit oläslig text som onboardingens "GÅ VIDARE". Samma odefinierade state i två generationer ⇒ **systemluckan är bekräftad mönsterbildande**. En disabled-regel i DESIGN-DECISIONS löser båda.

## 3 · 🟧 Plan-vyns röda cirklar — semantik utan legend

\#7 Nordström och #5 Virtanen är röda på planen (gröna annars), i både 8/11- och 11/11-läget. Inget förklarar varför (form? kondition? fel position?). Semantisk färg utan nyckel = brus per synlighetsprincipen. **Försoning:** mikro-legend vid FORMATION-raden (à la "• = rekommenderat") eller tagg i spelarraden som säger samma sak. Överlever in i LedgerFrame-designen — slot-planen där har samma behov.

## 4 · 🟧 Emoji utanför låsta kartan — nu mönster, inte enstaka

- ✨ ("Fyll bästa elvan"-knappen)
- 🎥 / ⚡ (Spelläge-korten Full/Snabb; 📰 Kommentar är också utanför kartan)
- (Del 1: 📌)

README §Emoji: "Don't invent new emoji — if your concept doesn't fit, use a Lucide icon instead." Spelläge-väljaren är chrome, inte kategori-etikett → **Lucide** (Video/Newspaper/Zap finns i setet, stroke 1.8). ✨ på en funktionsknapp är dessutom AI-slop-territorium. Prio: kosmetiskt per yta, 🟧 som mönster.

## 5 · 🟨 Taktik-segmentens tre-state-styling ⤳LF

Ej valt = grå · rekommenderat = **fet svart + dot** · valt = copper-fyllt. Fet svart på ovalt alternativ läser som "redan valt" vid snabb scanning — två starka signaler konkurrerar. Räcker: dot:en ensam (legenden finns ju). Lågt prio, ärvs som princip in i nya taktik-fliken.

## 6 · 🟨 Italic-feedbackraderna i Taktik — verifiera token

"Matchar förslaget…" / "Jonas Nilsson är hörnspecialist — bra val." renderar i en röd-aktig ton. Om det är `--danger` är det fel familj för positiv bekräftelse (ska vara `--accent-dark`/`--accent-deep`-italic, quote-vokabulären). Kan inte avgöras säkert från screenshot — **kodverifiering** (en grep).

## 7 · 🟨 Stray glyf i mastheaden

I samtliga fem screens ligger en halvrenderad ljus glyf (byggnads-/arena-silhuett?) bakom headerns mitt, klippt av kanten. Ser ut som en felpositionerad TownSilhouette eller ikon-rest. Kodverifiering: vad renderas där och ska det synas? (Syntes även svagt i onboarding-portalen, Del 1.)

## 8 · 🟨 Wizard-kromen i övrigt ⤳LF — fixa inte, ersätt

Steg-cirklar 1-2-3, Lista/Plan-segmentkontrollen (fjärde tab-idiomet i appen vid sidan av Club-underline, Transfers-pill, kommande LedgerFrame-tabbar), "8 AV 11 PLACERADE"-etiketten, hero-kortets dubbla cup-rader (banner + quote-bar säger båda "kvartsfinal/en match avgör"). Allt detta försvinner med LedgerFrame-wiringen — listas bara så att ingen "fixar" det separat.

---

## Rangordnad försoningslista (Del 2)

| # | Fynd | Prio |
|---|------|------|
| 0 | **LedgerFrame-Förbered saknas i build trots klar-rapport — Code redovisar** | 🟥🟥 process |
| 1 | RPS-strip: fel aktiv fas + ⊘-glyf → ✓/⬡-kanon | 🟥 |
| 2 | Disabled-CTA-regel (bekräftad i 2 generationer) → ratificera + fixa | 🟧 |
| 3 | Plan-vyns röda cirklar → legend/tagg | 🟧 |
| 4 | Emoji-mönstret (✨🎥⚡📰📌) → Lucide i chrome | 🟧 |
| 5 | Taktik tre-state → dot ensam | 🟨 ⤳LF |
| 6 | Italic-feedback token-verifiering | 🟨 kod |
| 7 | Masthead-glyfen → kodverifiering | 🟨 kod |
| 8 | Övrig wizard-krom → ersätts av LedgerFrame, rör ej | ⤳LF |

**Till steg 3-genomgången:** disabled-state (nu bekräftad), semantisk-färg-utan-legend som återkommande klass (pitch-cirklar; jfr stripe-färger), emoji-i-chrome-gränsen behöver en hård regel ("emoji endast i sektionsetiketter, aldrig på knappar/väljare").

— Design-Claude (Fable), del 2


---

# KAPITEL 3

# AUDIT — Visuell konsekvens · Del 3: Match live → Halvtid → Slutsignal → Granska

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 5 as-built-screens (live HL1 · halvtidsmodal · HL2 m. hörn-val · FT · Granska)

---

## ⓪ · 🟥🟥 META forts: wiring-status är TRE olika lägen

| Yta | Status i 050bb22 |
|---|---|
| Förbered | Legacy (Del 2) — inget av greenlit design |
| **Match live** | **HALVT wirad** — LedgerFrame-masthead + RPS-strip finns, MEN legacy GameHeader + legacy PhaseIndicator renderar OVANFÖR → dubbel krom |
| Halvtidsmodal | Nära godkänd design (tabbar, paussnack-kort, mono-annotationer) — bäst i klassen |
| Granska | Pre-fork-versionen (matchrapport + tabell/form + klubb + omvärld i EN skärm) — recut 06-09 ej inne |

Det förklarar Opus-rapporten: *något* wirades (match-kromen), men halvfärdigt och inte ytorna som rapporterades. Code redovisar per yta.

---

## 0 · Verifierat rent / starkt

- ✅ **Tidslinjen** — mål-ticks + nu-markör, kompakt ≈ kanon (scoreboard-stalvallen-v2)
- ✅ **MomentumBar + sparkline** — copper vs ice, ärlig mot motorn, narrativ-bandet ("Det jagande laget får luft") med stripe ✓ exakt motorkänsla-briefens intention
- ✅ **Matchflödet** — rytmen tag-rader (MÅL/UTV/RÄDD i mono-pills) + kursiva atmosfärsrader är stark; copper-stripe på målrader ✓
- ✅ **Utvisnings-raden på tavlan** (▲ #7 U. Kjell… 08:00 nedräkning) — precis rätt
- ✅ **Halvtidsmodalens paussnack** — serif-val + mono-konsekvensannotationer, citat, copper-CTA ✓
- ✅ **Post-match-papperskortet** (SLUT · verdict · "Se sammanfattning →") — fin ceremoni-växling mörkt→papper

## 1 · 🟥 Dubbel krom på match-skärmarna

Uppifrån: legacy GameHeader (44px) → legacy fas-strip → **LedgerFrame-masthead** → **LedgerFrame-RPS-strip**. Fyra staplade header-band, ~150px av skärmen, två av dem säger samma sak som de andra två. **Försoning:** wirade skärmar gömmer legacy-kromen (samma mekanism som HIDDEN_PATHS för BottomNav). Prio: 🟥 — spelets mest sedda yta under längst tid.

## 2 · 🟥 Datamotsägelse i dubbelkromen: "Omg 1" vs "OMG. 2"

Legacy-headern säger Omg 1, LedgerFrame-mastheaden säger OMG. 2 — **på samma skärm**. En av dem ljuger (cupmatch räknas sannolikt inte som seriomgång → legacy rätt, masthead fel?). Förtroendebrytare av samma klass som 4051/52. Löses delvis av §1, men räknelogiken i mastheaden måste rättas oavsett.

## 3 · 🟧 LED-tavlan driftar från Stålvallen-kanon

| Kanon (`scoreboard-stalvallen-v2`, godkänd) | As-built |
|---|---|
| Klubbnamn **Georgia 800 ovanpå** LED-rutan — kontrasten är poängen | Mono letterspaced, trunkerat ("Västan"/"Skutsk") |
| Score + tid i `--led-score` (röd) | Hemma amber, borta isblå, endast HL/tid röd |
| 3-bokstavskoder (FOR/VÄS) | Trunkerade namn |

Hemma/borta-färgkodningen är en *idé* (amber=hemma, ice=borta) men den är inte den godkända tavlan — och den spränger LED-palettens reservat (amber = `--led-warn` är utvisningarnas färg; nu betyder den också "hemmamål" OCH hemma-statistik längre ner). **Försoning:** tillbaka till kanon: röda siffror, Georgia-namn över tavlan. Prio: 🟧 — subsystemet är systemets flaggskepps-kontrast (Princip 2).

## 4 · 🟧 LED-rött läcker in i halvtidsmodalen

Stora "6—0" i modalen är LED-röd text på mörk yta. README §Palette: LED-paletten "reserved exclusively for the live scoreboard overlay". Godkända halvtidsmocken hade Georgia-siffror. **Försoning:** Georgia 800, `--text-light` eller copper. (Röd 6—0 läser dessutom som "ni ligger under" — semantiskt bakvänt när man leder.)

## 5 · 🟧 Granska är pre-fork — och CTA:n bevisar det

Skärmen blandar matchrapport (RESULTATET/STATISTIK/NYCKELMOMENT) med svep-innehåll (TABELL/FORM/KLUBBEN/OMVÄRLDEN) och stänger med **"KLAR — NÄSTA OMGÅNG →"** — en hopslagning av exakt de två CTA:er fork-beslutet (06-09, låst) håller isär. ⤳recut: hela skärmen ersätts av svep-utanför + 4-fliks-ledger. Fixa inte delar.

## 6 · 🟧 Tomma kort renderas med "—" (TABELL · FORM)

Cupmatch → tabell/form opåverkade → korten renderar tomma med ett streck. Tredje instansen av klassen "struktur utan innehåll" (FORM-raden Del 2, sparklines 05-31). **Försoning:** göm kort utan data. Regeln förtjänar nu en DESIGN-DECISIONS-rad: *"Ett kort utan innehåll renderas inte."*

## 7 · 🟧 Samma beslut, två renderingar — Transferbudet

Portal (Del 1): Acceptera fylld copper + Kräv mer/Avslå outline, horisontellt. Granska: tre staplade vita likvärdiga knappar — ingen primär alls. Samma decision-data, två komponenter. **Försoning:** EN decision-card-komponent renderar båda ytorna (Portal-versionen är den korrekta — den har hierarki).

## 8 · 🟨 Färgsemantik utan legend, instans 3: Nyckelmoment

Spelarnamn i grönt/amber/copper i tidslinjen (Holmgren grön 42', Kjellström amber 27', Ljungberg copper 72') — utvisning/mål/straff? Ingen nyckel. Samma klass som pitch-cirklarna (Del 2 §3). Försoning: mikro-legend eller ikon istället för färg.

## 9 · 🟨 Off-map-emoji, instans 3 — nu överallt i match-chrome

🏛 (MATCH-etiketten) · ⚙ (TAKTIK-knappen) · 😡 ("Vägra presskonferens"-knappen) · emoji-glyfer som FÖRDJUPA-flikikoner. Mönstret från Del 1–2 bekräftat i tredje domänen. Regelförslaget står: **emoji endast i sektionsetiketter; chrome och knappar = Lucide.**

## 10 · 🟨 Dubbel bottenkrom under match

"MATCH PÅGÅR — SPELA KLART"-bannern + BottomNav samtidigt. Match live är ceremoniell fullskärm — BottomNav borde gömmas (HIDDEN_PATHS), bannern räcker. Kodverifiering varför den inte träffas.

## 11 · 🟨 Hörn-valets gröna — token-verifiering

Selection-grön (MITT-rutan, pilen, HÅRT-knappen) ser ljusare ut än `--success`. Om rå hex: ersätt med `--success`/`--led-period`-familjen. Själva UI:t (sannolikhets-zoner, MV-position, segmenten HÅRT/LÅGT/KORT, MB-citatet) är bra och behåller bandy-logiken — bara färgen ska hem.

## 12 · 🟨 Copy: "FÖRVÄNTAD RIKTNING PÅ BAREN I ANDRA"

"Baren" (= momentum-baren) läser som puben. "Trycket i andra" eller "förväntad riktning i andra" — bandysvenskare.

---

## Rangordnad försoningslista (Del 3)

| # | Fynd | Prio |
|---|------|------|
| 0 | Wiring-status per yta redovisas av Code (tre olika lägen) | 🟥🟥 process |
| 1 | Dubbel krom → legacy göms på wirade skärmar | 🟥 |
| 2 | Omg 1 vs OMG. 2 — räknelogik i masthead | 🟥 |
| 3 | LED-tavlan → Stålvallen-kanon (röd, Georgia-över) | 🟧 |
| 4 | LED-rött ut ur halvtidsmodalen → Georgia | 🟧 |
| 5 | Granska ⤳recut (fork-beslutet) — fixa inte delar | 🟧 |
| 6 | Tomma kort renderas inte (ny DESIGN-DECISIONS-rad) | 🟧 |
| 7 | En decision-card-komponent (Portal-varianten vinner) | 🟧 |
| 8 | Nyckelmoment-färger → legend/ikon | 🟨 |
| 9 | Emoji-i-chrome-regeln ratificeras | 🟨 |
| 10 | BottomNav göms under match | 🟨 kod |
| 11 | Hörn-grön → token | 🟨 kod |
| 12 | "Baren"-copyn | 🟨 |

**Till steg 3-genomgången:** "struktur utan innehåll"-klassen (3 instanser) och "semantisk färg utan legend"-klassen (3 instanser) är systemets två största återkommande svagheter — båda saknar regel i DESIGN-DECISIONS. Plus: LED-palettens reservat behöver en hårdare formulering (två läckage i en build).

— Design-Claude (Fable), del 3


---

# KAPITEL 4

# AUDIT — Visuell konsekvens · Del 4: Granska-flikar · Helgen-beat · Portal 2

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 5 screens (Spelare · Shotmap · Analys · Helgen-beat-overlay · Portal inför semifinal)

---

## 0 · Verifierat rent / starkt

- ✅ **Shotmap är implementerad** (net-new) — delad plan ("VI ANFALLER / DE ANFALLER"), färglegend FINNS (mål/räddade/miss per lag), skottmönster-kort + insikt. Den enda färgsemantiken i builden med nyckel — så här ska det se ut
- ✅ **Analys-fliken**: assistenttränar-rösten (MB-banner + citat) ✓, händelsetidslinje hemma/borta ✓, formspelare med Georgia-betyg ✓
- ✅ **Spelarporträtten är inne** — cirklar i betygslistan, ansikten i övre tredjedelen ✓ kanon
- ✅ **Helgen-beaten** — ⬩-eyebrow, tre kursiva Georgia-stycken, copper-stripe, "TRYCK FÖR ATT FORTSÄTTA →". Mycket nära A3-beat-designen; copyn är precis rätt understatement
- ✅ FORM-raden i NextMatchCard populerar nu (två gröna) — bekräftar Del 2 §6 självläker med data
- ✅ "2 ohanterade händelser — du kan hantera dem i Översikt" — bra återvändar-affordans

## 1 · 🟥 ENGELSKA positionsetiketter i Spelare-fliken

"forward · 3 mål · 2 assist" · "goalkeeper · 3 räddningar" · "midfielder", "defender", "half" — **engelska och svenska blandas i samma rad.** Bryter hård regel #10 (Swedish copy only) OCH positions-kanon (MV / B / YH / MF / A, regel #7). **Försoning:** positionsförkortningarna rakt av — de är redan etablerade i Förbered-listan (Del 2-screens visar MV/B/YH/MF/A korrekt!). Samma data, två språk i två ytor = wiring läser fel fält. Prio: 🟥 — språkregeln är produktidentitet.

## 2 · 🟧 Backdrop-blur på Helgen-beaten

Portalen bakom overlayn är BLURRAD. README §Transparency: "rgba(0,0,0,0.6), **no blur** — no frosted-glass / backdrop-filter anywhere." Beat-mocken använde mörk scrim. **Försoning:** byt `backdrop-filter` mot 0.6-scrim. (Om Code/Opus vill ratificera blur för just beats — det är en DESIGN-DECISIONS-fråga, inte ett tyst undantag. Min hållning: scrim räcker, blur är inte papper-och-läder.)

## 3 · 🟧 Gold på Milstolpe-kortet — DB-2-gränsen

"★ MILSTOLPE · Karriärsmilstolpe: Hampus Nordström" har gold-stripe + gold-stjärna för ett hattrick. DB-2: guld är reserverat för SM-final/mästare/det exceptionella. En karriärsmilstolpe är fin men inte final-nivå — och guldinflation är exakt det reserv-principen varnar för. **Försoning:** ⭐-emojin är legitim (kartan: ⭐ Betyg) men stripe + rubrik i copper, inte gold. Spara guldet.

## 4 · 🟧 FÖRDJUPA-flikikonerna korsar emoji-kartans betydelser

🎓 används som Analys-ikon — men 🎓 ÄR Akademi i den låsta kartan. 🎯-aktig för Översikt, 👥 (= Trupp-kategorin) för Spelare. Emoji-kartan är ett semantiskt kontrakt; återbruk med ny betydelse bryter det. **Försoning:** flik-ikoner är chrome → Lucide (Target/Users/TrendingUp/GraduationCap-ekvivalenter i stroke 1.8). Samma regel som Del 2 §4/Del 3 §9 — tredje bekräftelsen.

## 5 · 🟧 Sektionsetiketter utan emoji — massdrift eller ny norm?

STARTELVA — BETYG · BÄNKEN · SKOTTBILD · HÄNDELSETIDSLINJE · FORMSPELARE · NYCKELINSIKTER · CUPFINALHELGEN — inga emoji-prefix. README-regel #3: "Section labels are always 8px / 2px-ls / uppercase **with a prefix emoji**." Detta är för utbrett för att vara slarv — Granska-generationen har tyst etablerat en renare norm. **Jag tycker den nya normen är bättre** (mindre brus i datatunga ytor), men då ska regeln ratificeras: t.ex. *"emoji-prefix på domän-sektioner (Portal/Klubb), inte på data-sektioner inuti rapporter"*. Beslutsfråga till DESIGN-DECISIONS — inte tyst drift åt något håll.

## 6 · 🟨 Oförklarad stjärnmarkör på I. Ros

Matchens spelare var Nordström (10.0), men ⭐ sitter på Ros (6.5) i betygslistan. Vad betyder den? Om det är "förra matchens stjärna" eller "kaptensval" — säg det. Omarkerad markör = brus. Kodverifiering.

## 7 · 🟨 Event-terminologin blandar tre ord för hörna

Samma tidslinje: "Hörnslag" (5'), "Hörna" (29'), "Hörnmål" (9'). Hörnmål är legitimt distinkt (mål PÅ hörna); Hörnslag vs Hörna är samma händelse med två namn. En term (Hörna) i copy-poolen.

## 8 · 🟨 Transferbudet dubbelrenderas på Portalen

HÄNDELSE-kortet (beslut: Acceptera/Kräv mer/Avslå) OCH BUD-kortet (status: "Hallgren · 110 tkr · svar krävs") visar samma bud på samma portal — Portal 1 och Portal 2 båda. Beslut + status för samma objekt = ett kort. **Försoning:** när beslutet är obesvarat visas bara decision-kortet; BUD-raden är för bud som väntar på MOTPARTEN.

## 9 · 🟨 NEUTRAL PLAN-dubbletten kvarstår (Portal 2)

Samma som Del 1 §5 — pill + tagrad. Bekräftat mönster, samma fix.

---

## Rangordnad försoningslista (Del 4)

| # | Fynd | Prio |
|---|------|------|
| 1 | Engelska positioner → MV/B/YH/MF/A (fält-wiring) | 🟥 språk |
| 2 | Helgen-beat: blur → 0.6-scrim | 🟧 |
| 3 | Milstolpe: gold → copper (DB-2) | 🟧 |
| 4 | FÖRDJUPA-ikoner → Lucide (emoji-kartan korsas) | 🟧 |
| 5 | Sektionsetikett-emoji: ratificera ny norm ELLER återställ | 🟧 beslut |
| 6 | Ros-stjärnan förklaras/tas bort | 🟨 kod |
| 7 | Hörnslag/Hörna → en term | 🟨 copy |
| 8 | Bud: beslut+status → ett kort | 🟨 |
| 9 | NEUTRAL PLAN-dubblett (mönster, fix en gång) | 🟨 |

**Till steg 3-genomgången:** emoji-systemet är under tryck från två håll samtidigt — off-map-emoji läcker IN i chrome (Del 2–3) medan kanon-emoji försvinner UT ur sektionsetiketter (Del 4 §5). Det är inte två problem utan ett: emoji-regelns domän är fel definierad. En ny, skarpare regel (emoji = domän-kategorier på översiktsytor; Lucide = chrome; inget = data-sektioner) löser båda riktningarna.

— Design-Claude (Fable), del 4


---

# KAPITEL 5

# AUDIT — Visuell konsekvens · Del 5: Beats · Kommentar-läge · Kafeterian · åter till Portal

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 8 screens (Portal semi · match-laddningsbeat Forsbacka · live kommentar-läge · halvtid 2–0 · FT 6–4 · Kafeterian-scen · Pokalen-beat · Portal omg 1)

---

## 0 · Verifierat rent / starkt — bästa batchen hittills

- ✅✅ **EFTERKLANG-FLÖDESDESIGNEN ÄR IMPLEMENTERAD** — exakt 06-03-mockens struktur: generisk ⬩ EFTERKLANG ⬩-rubrik + "1 tråd", typ-ikon + namn (⚔ DAVID MATTSSON), **premiss-rad** ("2 mål mot er den här säsongen."), **eko i kursiv** ("Forsbacka igen. Det tar visst aldrig riktigt slut mellan er."), chevron per rad. Vem/premiss/eko håller. Detta är legibility-passets hela poäng, live
- ✅✅ **Portal-kureringen är inne** — Kafeterian som story-slot-kort ("Klicka för att lyssna →") som öppnar en egen scen. Scenen själv (I DETTA ÖGONBLICK · dialograder vänster/höger med roll-etiketter · kursiva repliker · outline-exit) är fin bandysvensk vardag — och exit:en är korrekt OUTLINE, inte primär (scenen är miljö, inte beslut)
- ✅ **Beat-vokabulären bär:** Pokalen-beaten (cup-exit, "Vår cup är slut. Tre matcher om vi var med långt, en om det inte gick.") och match-laddningsbeaten (Forsbacka · Borta · Utslagsmatch · "Det sitter hårdare i magen än en seriematch.") följer A3-strukturen. Copyn är genomgående rätt
- ✅ **Vi/dom-kodningen är konsekvent**: amber = managed klubb, is-blå = motståndare — på tavlan, statistiken OCH tidslinjen, hemma som borta. Det är en SYSTEMATISK avvikelse från Stålvallen-kanon (röd), inte slarv — se §1
- ✅ **Kommentar-läget** — ren feed utan interaktionskort, precis "Följ utan stopp"-löftet. Tutorial-hinten ("Vid hörnor får du välja") är rätt placerad och stängbar
- ✅ Serie-NextMatchCard fullt populerad: positions-pills (8:E/7:E), motståndar-arketyp i kursiv ("Pragmatiker"), form-rutor båda lagen

## 1 · 🟧 OMPRÖVNING av Del 3 §3: vi/dom-färgkodningen är en designidé, inte drift

Med fler screens är mönstret tydligt: amber/is-kodningen är genomförd överallt och GÖR ETT JOBB (du hittar ditt lag på en blick, även borta). Stålvallen-kanon (allt rött) är mer fysiskt trogen Westerstrand; vi/dom-kodningen är mer spelbar. **Detta är inte längre ett försoningsfynd utan en beslutsfråga till Opus/Jacob:** ratificera vi/dom-kodningen som scoreboard-kanon (uppdatera scoreboard-stalvallen-v2 + LED-tokens med `--led-us`/`--led-them`-roller), ELLER återställ röd. Jag lutar åt **ratificera** — den bryter mot förlagan men förstärker spelet, och Georgia-över-LED-kontrasten (det viktiga i Princip 2) är oberoende av sifferfärgen. Det som INTE ska ratificeras: mono-trunkerade klubbnamn ("Forsba"/"Västan") — Georgia-namnen över tavlan står fast (Del 3 §3 kvarstår där).

## 2 · 🟧 Match-laddningsbeatens CTA bryter CTA-kanon

"Sätt laget →" — sentence case + pill. CTA-kanon: UPPERCASE + 1.5px ls + 12px radie (`.btn-cta`). Onboarding-pillen (Del 1 §2) återkommer alltså i nyaste ytan — pill-CTA:n håller på att bli ett eget strata. **Försoning:** "SÄTT LAGET →" i `.btn-cta`. Samma fix-PR som Del 1 §2.

## 3 · 🟧 Blur bekräftad som mönster (instans 2: Pokalen-beaten)

Portalen bakom Pokalen-beaten är tydligt blurrad — samma som Helgen (Del 4 §2). Två beats = mönster, inte engångs. Antingen scrim (kanon) eller ratificera "beats får blur" i DESIGN-DECISIONS. Min rek står: scrim.

## 4 · 🟨 Dubbel ⬩ CUPEN ⬩ i laddningsbeaten

En svag mitt-på-skärmen + en i text-blocket. Illustration-placeholder förklarar tomrummet (känd, kö-lagd) — men när bilden kommer ska bara EN eyebrow finnas. Notera i illustrations-wiringen.

## 5 · 🟨 "MATCH PÅGÅR — SPELA KLART" kvarstår efter slutsignal

FT-skärmen visar fortfarande bannern. Matchen är slut — texten ljuger. State-byte: "MATCH SLUT — SE SAMMANFATTNING" eller göm (papperskortet har redan CTA:n).

## 6 · 🟨 Scen-eyebrow-inkonsekvens + ☕ som scen-ikon

Kafeterian: "I DETTA ÖGONBLICK" utan ⬩ ⬩ medan ANKOMSTEN/HELGEN/CUPEN/POKALEN har dem. Plus ☕-emoji som dekorativ scen-ikon (utanför kartan, dekorativ användning). Försoning: ⬩ I DETTA ÖGONBLICK ⬩, släpp emojin — Georgia-rubriken bär.

## 7 · 🟨 KONDITION-cellen blev sparkline bredvid numeraler

Portal-statsraden: KONDITION = mini-graf, FORM = 60, KASSA = 382 tkr. Två representationer i samma rad — och sparkline-disciplinen (05-31-handoffen) säger sparklines förtjänas, inte strös. Antingen alla tre numeraler (kanon) eller motivera varför kondition är trenden som förtjänar grafen — men då i eget kort, inte i footerraden.

## 8 · 🟨 Motståndarens färg i halvtidsmodalen: röd, inte is

"Matchens spelare: David Mattsson · MF" i rött — men dom-kodningen är is-blå överallt annars. Rött = fara/negativt i systemet; här betyder det bara "deras spelare". En kodning per betydelse: is för motståndare.

## 9 · Bekräftelser av tidigare fynd (ingen ny åtgärd)

- "Omg 1" (header) vs "OMG. 3" (masthead) — räknelogiken förklarad: mastheaden räknar ALLA matcher, headern serieomgångar. En definition ska vinna (Del 3 §2); serieomgång är spelets språk ("22-omgångar"), matchnummer är motorns
- 💡-tutorial-hint = off-map-emoji-instans (mönstret, Del 2–4)
- Budet (HÄNDELSE + BUD-kort) dubbelrenderas fortfarande (Del 4 §8)

---

## Rangordnad försoningslista (Del 5)

| # | Fynd | Prio |
|---|------|------|
| 1 | Vi/dom-LED-kodning: RATIFICERA (eller återställ) — beslutsfråga | 🟧 beslut |
| 2 | Beat-CTA → `.btn-cta` uppercase (samma PR som Del 1 §2) | 🟧 |
| 3 | Beat-blur → scrim (eller ratificera) | 🟧 beslut |
| 4 | Dubbel eyebrow i laddningsbeat (fix vid illustrations-wiring) | 🟨 |
| 5 | "MATCH PÅGÅR"-bannern efter FT → state-byte | 🟨 |
| 6 | Kafeterian: ⬩-eyebrow + släpp ☕ | 🟨 |
| 7 | KONDITION-sparkline i statsraden → numeral | 🟨 |
| 8 | Motståndare i modal: röd → is | 🟨 |

**Till steg 3-genomgången:** två kandidater där as-built har UTVECKLAT systemet snarare än driftat från det — vi/dom-LED-kodningen och de emoji-fria data-sektionsetiketterna (Del 4 §5). Båda är förbättringar som förtjänar ratificering. Det är ett gott tecken: driften är inte bara förfall, den innehåller designarbete som ska skördas.

— Design-Claude (Fable), del 5


---

# KAPITEL 6

# AUDIT — Visuell konsekvens · Del 6: Toppnav-chrome (Spelguide · Inkorg · Meny)

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 3 screens (Hur funkar det?-modal · Inkorg · kugghjuls-meny)

---

## 0 · Verifierat rent / starkt

- ✅ **Spelguide-modalens copy** — "Allt du behöver veta. Resten lär du dig på isen." + sex terse kort ("Kassan är tight. … Minusbudget = styrelsen tappar tålamodet.") är exakt rätt röst. Centrerad ljus modal, ingen blur ✓ kanon
- ✅ **Inkorgens IA** — VIKTIGT / NYHETER / RAPPORTER-gruppering med antal, "Markera alla som lästa", Kronologiskt-toggle, oläst-dot per rad. Strukturen är rätt
- ✅ Stripe-vänsterkant per radgrupp, datum höger, terse titlar ("Förlust som inte borde överraska någon" — fin journalistros)

## 1 · 🟧 Dubbel navigering till Spelguiden (Jacobs fynd — bekräftat)

?-knappen i headern OCH kugghjuls-menyns "Spelguide" öppnar samma modal. Två ingångar till samma innehåll i samma 44px-header är redundant chrome — och menyn blandar därmed två kategorier (spara/ladda = spelhantering; spelguide = hjälp). **Försoning:** behåll **?** (upptäckbarast för nya spelare, hjälp-konventionen), stryk menyraden. Menyn blir ren spelhantering: Spara spel · Ladda spel. Ingen ny komponent.

## 2 · 🟧 Semafor-emojin är tillbaka — i Inkorgen

Sektionsmarkörerna är 🔴 VIKTIGT · 🟡 NYHETER · ⚪ RAPPORTER. Det är exakt mönstret transfers-fixen tog bort 2026-05-17 (§1.3, semafor-emoji → tokens) — det har återuppstått i en annan yta. **Försoning:** samma som då: CSS-dots i token-färger (`--danger` / `--warning` / `--text-muted`) eller bara etiketten i färg. Emoji-bollar är inte systemets severity-språk. Prio: 🟧 — beviset på att utan ratificerad regel återföds mönstret (argument för emoji-regeln i steg 3).

## 3 · 🟨 Dubbla ikoner per inkorgsrad

Rader har typ-ikon (🏛/klubba/🏆/📋) OCH ibland en inline-emoji i titeln ("🗞 Spekulationer…", "🛡 Skutskär efter matchen"). Två ikoner per rad = brus i en yta vars jobb är snabb scanning. **Försoning:** en ikon per rad — typ-ikonen vinner, inline-emoji bort ur titel-strängarna (copy-pool-städning).

## 4 · 🟨 Off-map-emoji i chrome, instans 5

🔄 ("Visa introduktionen igen"-knappen) · 💾 📁 (menyraderna) · 🏛 (milstolpe-typikon). 📖 Spelguide är däremot PÅ kartan ✓. Samma försoning som tidigare delar: chrome = Lucide (RotateCcw/Save/FolderOpen/Landmark). Mönstret är nu belagt i samtliga sex domäner.

## 5 · 🟨 Verifiera Matchen-ikonen: 🏒 eller 🏑?

Spelguidens Matchen-kort visar en klubba som i skärmdumpen ser ut som 🏑 (field hockey). Hård regel #7: 🏒 alltid. En tecken-fix om den är fel — men just DEN regeln är produktens stolthet, så värd en grep.

## 6 · 🟨 RPS-strip på Inkorgen

Fas-indikatorn (FÖRBERED—SPELA—GRANSKA) renderar på Inkorgen — en icke-fas-yta. Kanon: PhaseIndicator "under the header on gameplay screens". Inkorgen är arkiv/notiser, inte fas. Göm den där (samma synlighetsregel som BottomNav/HIDDEN_PATHS).

---

## Rangordnad försoningslista (Del 6)

| # | Fynd | Prio |
|---|------|------|
| 1 | Spelguide: en ingång (behåll ?, stryk menyraden) | 🟧 |
| 2 | Inkorg: semafor-emoji → token-dots (mönster-recidiv) | 🟧 |
| 3 | En ikon per inkorgsrad (inline-emoji ur copy) | 🟨 |
| 4 | Chrome-emoji → Lucide (instans 5: 🔄💾📁🏛) | 🟨 |
| 5 | 🏒-grep på Spelguidens Matchen-ikon | 🟨 kod |
| 6 | RPS-strip göms på Inkorg | 🟨 |

**Till steg 3-genomgången:** semafor-recidivet (§2) är det starkaste enskilda argumentet för att emoji-regeln måste RATIFICERAS, inte bara fixas punktvis — ett mönster som togs bort i maj återuppstod i juni i en annan yta. Regler som bara lever i åtgärdslistor dör; regler i DESIGN-DECISIONS + lint-guard överlever.

— Design-Claude (Fable), del 6


---

# KAPITEL 7

# AUDIT — Visuell konsekvens · Del 7: Trupp (NU · TRUPP · TAKTIK)

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 3 screens (NU-flik · TRUPP-lista · TAKTIK/Formation)

---

## 0 · Verifierat rent / starkt — trupp-redesignen är till stor del LIVE

- ✅ **Säsongsbåge-kortet** med legend (Grundform/Dagsform/Skärpa/Topp-zon) — legend på plats ✓, lägesknappar Bygg/Håll/Toppa/Vila, "Truppen: Håll · 0 undantag"
- ✅✅ **"Ingen reagerar. Hela truppen följer Håll."** — DET HÄR är "struktur utan innehåll"-klassen löst RÄTT: status-rad i kursiv istället för tomt kort. Exemplet att peka på i DESIGN-DECISIONS-regeln
- ✅ **Arc-taggarna** (Peak/Utvecklas/Avtar) per spelare ✓ · **civilyrkes-taggarna** (Sjuksköterska/Polis/Elektriker/IT-konsult, ⭐ Proffs) — bruksorts-DNA i truppen, härligt ✓ · Hörnspec.-tagg ✓
- ✅ **KEMI- och ANTECKNINGAR-flikarna finns** i Taktiktavlan · formations-pills med "★ COACH"-rekommendation · TRYGG/KRÄVER LIBERO-egenskapstaggar · coach-citatet ("…det finns en trygghet i det kända.") · bänken · "Formation påverkar nästa match"-hjälprad
- ✅ Veckans rytm (Mån–Sön, matchdag markerad, träningsfokus + nästa match) — tät och informativ
- ✅ Filter (Alla/MV/B/YH/MF/A) + sortering (Position/Styrka/Form/Ålder)

## 1 · 🟥 TRE positionsvokabulärer samtidigt — systemfyndet

På samma flik-trio:
| Yta | Vokabulär |
|---|---|
| TRUPP-kort + filterpills | **MV / B / YH / MF / A** (kanon ✓) |
| OMKLÄDNINGSRUMMET/Stammen-rader | "goalkeeper", "defender" (engelska — samma som Granska-betygslistan, Del 4 §1) |
| BÄNKEN-korten | "GOA / DEF / HAL" (pseudo-engelska treställiga) |

Samma enum, tre renderingar av tre komponenter. Detta uppgraderar Del 4 §1 från yt-fynd till **systemfynd**: det finns ingen delad positions-label-helper. **Försoning:** EN helper (`positionLabel()` → MV/B/YH/MF/A), alla ytor konsumerar den. Grep-bar: "goalkeeper|defender|midfielder|forward|GOA|DEF|HAL" i presentation/.

## 2 · 🟧 Drag-hinten är global men handlar om en annan vy

"💡 Dra spelare till positioner. Grön ring = rätt plats. Gul = kan funka…" visas överst på ALLA tre flikar — men beskriver pitch-interaktionen (TAKTIK/Formation respektive Förbered-planen). På NU-fliken är den brus. Dessutom: ring-legenden (grön/gul) är exakt den legend Del 2 §3 efterlyste för planens cirklar — **den finns alltså, men bor i en stängbar hint istället för vid planen.** **Försoning:** hinten visas endast i pitch-kontext; ring-legenden blir permanent mikro-legend vid planen (à la "• = rekommenderat val"). Då löses Del 2 §3 samtidigt.

## 3 · 🟧 STÄMNINGSKURVA — naken graf

En blå linje utan värde, utan tidsaxel, utan nuläge. Vad är skalan? Vilken period? Sparkline-disciplinen (05-31): en graf förtjänas och förankras — minst aktuellt värde + periodangivelse ("senaste 8 omg"). Som den står är den dekoration. **Försoning:** nuvärde i Georgia till höger + periodtext i muted, eller fäll in i Säsongsbåge-kortet om det är samma data.

## 4 · 🟨 Bygg/Håll/Toppa/Vila i Georgia på knappar

Lägesknapparna är serif. Typroller: knappar = sans; Georgia = numeraler/ceremoniellt. Kan vara medvetet ("ledarord" som ceremoni) — i så fall ratificera; annars sans. Liten, men det är fjärde knapp-varianten i appen.

## 5 · 🟨 Styrka-siffrornas färger utan nyckel

52 amber, 66 svart, 41 amber i TRUPP-listan — form-färgning? potential? "Semantisk färg utan legend"-klassen, instans 4. Samma försoning: nyckel eller en färg.

## 6 · 🟨 Två precisioner för samma stat

Bänken: 40.8 / 45.8 / 30.9 — TRUPP-listan: 41 / 46 / 31. Heltal är spelets språk överallt annars (Georgia-numeraler). Avrunda bänken.

## 7 · 🟨 "två forwards" i coach-citatet

Anfallare. Samma engelska-läcka som §1, i copy-poolen.

## 8 · Status (ej drift): Squad-pulse-heron syns inte

NU-flikens topp är Säsongsbågen, inte squad-pulse-mätaren (fitness×0,5 + morale×0,4 − skador×5). Antingen ej byggd eller ej i denna build — notera i Code-redovisningen (Del 2 §0-listan), inget försoningsfynd.

---

## Rangordnad försoningslista (Del 7)

| # | Fynd | Prio |
|---|------|------|
| 1 | EN positions-helper — MV/B/YH/MF/A överallt (3 strata idag) | 🟥 system |
| 2 | Drag-hint → pitch-kontext; ring-legend → permanent vid planen (löser Del 2 §3) | 🟧 |
| 3 | Stämningskurvan förankras (värde + period) eller fälls in | 🟧 |
| 4 | Bygg/Håll/Toppa/Vila: ratificera serif eller byt till sans | 🟨 beslut |
| 5 | Styrka-färger: nyckel eller en färg | 🟨 |
| 6 | Bänk-decimaler → heltal | 🟨 |
| 7 | "forwards" → anfallare | 🟨 copy |
| 8 | Squad-pulse: status till Code-redovisningen | ❓ |

**Till steg 3-genomgången:** positions-vokabulären (§1) är samma lärdom som semafor-recidivet (Del 6): utan en DELAD komponent/helper divergerar tre ytor på samma data. Systemets svaghet är inte regler utan **saknade delade primitiver** — TabBar, decision-card, positionLabel, severity-dots. Det är skördelistan för steg 3.

— Design-Claude (Fable), del 7


---

# KAPITEL 8

# AUDIT — Visuell konsekvens · Del 8: Tabell (TABELL · STATISTIK · CUPEN)

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 3 screens (ligatabell · statistik · cup-bracket)

---

## 0 · Verifierat rent / starkt — domänens föredöme

- ✅✅ **Tabell-legenden är FÖREDÖMLIG**: "S = Spelade · MS = Målskillnad · P = Poäng · Form: ●grön=seger ●röd=förlust ●gul=oavgjort" — den enda fullständiga legenden i builden vid sidan av shotmapen. Detta är mallen för "semantisk färg utan legend"-klassens försoning (Del 2 §3, Del 3 §8, Del 7 §5)
- ✅ **Slutspelsstrecket + Nedflyttning** som namngivna separatorer med kantfärger (amber topp, röd botten) — tydlig zon-läsning, bandyspråk
- ✅ **Me-row-markeringen ★ Västanfors** konsekvent mellan ligatabell OCH cup-bracket ✓ · kontextraden "8. plats · I slutspelszonen · 2p till ledaren" ger tabellen en åsikt ✓
- ✅ **CUPEN-fliken är genomarbetad**: DINA CUPMATCHER (✓ Vidare / ✗ Utslagen), bracket med vinnare-fet/förlorare-muted, ranking-frikort-fotnoten, skyttekungar med egen spelare copper-markerad, status-bannern "Utslagen i semifinalen · 🏆 Forsbacka tog hem cupen"
- ✅ Pill-tabbarna = samma stil som Transfers → Club-underline (Del 2-audit 06-09) är nu ENSAM avvikare; delade TabBar-rekommendationen stärks
- ✅ MS-kolumn grön/röd, formprickar, Georgia-numeraler — allt enligt kanon

## 1 · 🟧 Dubblerad beskrivningsrad på TABELL och STATISTIK

Under flikraden: "Aktuell tabell med form och målskillnad." — och samma mening EN GÅNG TILL inne i statuskortet. STATISTIK: "Ligans toppskytt, assist och betyg." + "Ligans toppskyttar, assistkungar och betyg." staplade. Två nästan identiska rader efter varandra på två flikar = render-dubblett eller copy-rest. **Försoning:** EN beskrivningsrad per flik — behåll den i statuskortet (TABELL) respektive den rikare varianten (STATISTIK), stryk den lösa.

## 2 · 🟧 Tom sektion: "BÄST SNITTBETYG (MIN 3 MATCHER)"

Rubriken renderar med noll rader under (kravet ej uppfyllt så tidigt på säsongen). "Struktur utan innehåll"-klassen, **instans 5**. Här är dock rätt försoning inte att gömma utan Håll-mönstret (Del 7): en kursiv status-rad — *"Kräver 3 spelade matcher — kommer i omg 3."* Det lär spelaren att listan finns. Tomt under rubrik lär ingen någonting.

## 3 · 🟨 🔥 på Söderfors-raden — emoji-betydelse korsas igen

🔥 = Derby i den låsta kartan. På en tabellrad läser den som "het form/streak". Samma klass som 🎓-som-Analys (Del 4 §4). Om det är formstreak: formprickarna visar redan det — släpp emojin. Om det är derby-markering (nästa motståndare?): fel plats. Kodverifiering → sedan bort eller rätt markör.

## 4 · 🟨 "2 ast" — förkortningen

"ast" är ingen svensk konvention. "2 assist" ryms; annars "ass." Liten copy-fix i statistik-listan.

---

## Rangordnad försoningslista (Del 8)

| # | Fynd | Prio |
|---|------|------|
| 1 | Dubblerade beskrivningsrader (TABELL + STATISTIK) → en | 🟧 |
| 2 | Tom snittbetyg-sektion → kursiv status-rad (Håll-mönstret) | 🟧 |
| 3 | 🔥 på tabellrad → verifiera, sannolikt bort | 🟨 kod |
| 4 | "ast" → "assist" | 🟨 copy |

**Till steg 3-genomgången:** Tabell-domänen bevisar att systemet KAN leverera legend-disciplin och tom-tillstånds-hantering — legenden här och Håll-raden i Trupp är de två mönster som ska skrivas in i DESIGN-DECISIONS och pekas på. Domänerna som driftat (match-pitch, nyckelmoment, styrka-färger) behöver inte ny design — de behöver Tabellens befintliga mönster.

— Design-Claude (Fable), del 8


---

# KAPITEL 9

# AUDIT — Visuell konsekvens · Del 9: Transfers (Marknad · Scouting · Kontrakt · Fria · Sälj)

**Build:** 050bb22 · **Datum:** 2026-06-10

## 0 · Verifierat / förbättrat sedan 06-09-auditen

- ✅ **Scouting-listan är nu grupperad per position** (MÅLVAKT/BACK/YTTERHALV/MITTFÄLT) med "+14 fler"-expanders — 06-09 §4.3 åtgärdad
- ✅ **Talangspaning-formuläret flyttat till toppen** — 06-09 §4.5 åtgärdad
- ✅ Scoutbudget-dots, pill-tabbar, window-status utan semafor-emoji — håller
- ✅ FRIA-tabbens tomtillstånd är förebilden: "Inga fria agenter just nu. **Fria agenter dyker upp vid säsongsslut.**" — säger NÄR

## 1 · 🟧 "MV" betyder två saker i samma rad

Sälj-listan: "Jonathan Bäck — **MV** · Styrka 52 · **MV** 35 000 kr" — position Målvakt OCH Marknadsvärde med samma förkortning, två gånger på samma rad. **Försoning:** marknadsvärdet skrivs "Värde 35 tkr" (tkr-konventionen finns redan i kassan). Positions-MV är kanon och behåller förkortningen.

## 2 · 🟧 Femte tabben klipps utan affordans

SÄLJ syns som "S…" bakom FRIA på 375px — horisontell scroll utan indikation. **Försoning:** antingen krymp till ikon+kort label, eller fade-kant som visar att fler tabbar finns (samma lösning som LedgerFrame-tabbarna behöver vid 4+).

## 3 · 🟨 Tomtillstånden är tre olika renderingar

MARKNAD: kort med text ✓ · KONTRAKT: naken text utan kort · FRIA: kort med när-info ✓✓. **Försoning:** FRIA-mönstret överallt (kort + kursiv + när det ändras): "Inga kontrakt utgår snart" → + "Nästa: Kronqvist, omg 9."

## 4 · 🟨 🔥 som "intresse"-markör (instans 3 av emoji-korsning)

"🔥 1 klubb intresserad" på Hallgren — 🔥 = Derby i kartan, betyder nu också streak (Del 8) och intresse. Tre betydelser. **Försoning:** copper-text utan emoji räcker ("1 klubb intresserad" är stark nog).

## 5 · 🟨 "🔒 Legend"-knappen oförklarad

Petri Ljungberg kan inte säljas — knappen säger "Legend" med lås. Varför är han Legend? Ingen förklaring i raden. **Försoning:** tooltip/subrad ("Klubbikon — kan inte säljas") eller tagg i stil med arc-taggarna.

## 6 · 🟨 Scouting-pills "1 OMGÅNG"/"DIREKT" utan nyckel

Semantiken (scout-tid?) förklaras inte. Mikro-legend vid listhuvudet ("DIREKT = svar nu · 1 OMGÅNG = svar nästa omgång").

## Försoningslista

| # | Fynd | Prio |
|---|---|---|
| 1 | MV-kollisionen → "Värde X tkr" | 🟧 |
| 2 | Tab-overflow → fade/kompaktare | 🟧 |
| 3 | Tomtillstånd → FRIA-mönstret | 🟨 |
| 4 | 🔥-intresse → copper-text | 🟨 |
| 5 | Legend-lås förklaras | 🟨 |
| 6 | DIREKT/1 OMGÅNG-nyckel | 🟨 |

**Till steg 3:** Transfers visar att 06-09-audit-fixar LANDAR (gruppering, formulär-flytt) — loopen fungerar när fynden är konkreta. Och FRIA-tomtillståndet + Tabell-legenden + Håll-raden är nu de tre mönster som tillsammans täcker hela "struktur utan innehåll"/"semantik utan nyckel"-klassen.

— Design-Claude (Fable), del 9


---

# KAPITEL 10

# AUDIT — Visuell konsekvens · Del 10: Klubb (Träning · Ekonomi · Orten · Akademi · Minne · Tränare)

**Build:** 050bb22 · **Datum:** 2026-06-10

## 0 · Verifierat — 06-09-audit-fixar som LANDAT

- ✅✅ **Klubb-tabbarna är nu pill-stil** — underline-avvikaren borta; delade TabBar-rekommendationen genomförd
- ✅✅ **Akademi-legenden finns**: "★ = potential · CA = nuläge" (06-09 §1.2)
- ✅✅ **Anläggnings-ägarskapet löst**: Akademi-kortet säger "Uppgraderas via Orten-fliken" — Orten äger, Akademi läser (06-09 §1.4)
- ✅✅ **Kommun-agendan är spelbar**: "RÄKNAS FÖR AGENDAN: ◯ Bandyskola ◯ Bandyskola avancerad ◯ Skolbesök" + politiker-quote + nästa val — Orten-recutens Fable-fynd 2, implementerat
- ✅ Ortskartan med "Tryck på en nod för mer info" · Bygdens puls med trendpil ▲ · Mecenater-tomtillstånd förklarar VAD som lockar dem · frivilliga-rekryter visar effekt (+2 puls/omg · +1 tkr)
- ✅ Träningsprojekt med risk-nivåer + ⚡-legend ("⚡ = intensiv — snabbare, men högre skaderisk") · effekt-kortet visar exakta siffror · "Träningsskador denna säsong: Inga" ✓ rätt tomtillstånd
- ✅ Tränare: rivalitet-citaten ("Jag har inget otalt med Jacob. Jag har inget tal med honom alls.") — perfekt ton

## 1 · 🟥 MINNE-fliken är nästan oläslig — kontrast-bugg

Säsongsrubriker ("Säsong 2026") och minnesrader renderar i spök-text — nästan vit-på-vit. Hela flikens innehåll är oläsbart. Ser ut som en opacity/färg-bugg (text i `--bg`-nära färg på `--bg`). **Försoning:** kodfix — `--text-primary`/`--text-secondary` på minnesraderna. Klubbminnet är säsong 2+-själen; idag är den osynlig.

## 2 · 🟧 MINNE: fyra tomma fornsäsonger + fel säsongsformat

"Säsong 2025 / 2024 / 2023 / 2022 — Inga minnesvärda händelser ännu" ×4 — säsonger FÖRE karriärstarten listas tomma (struktur utan innehåll, instans 6). Och rubriken säger "Säsong 2026", inte "2026/27" (masthead-konventionen). **Försoning:** rendera bara spelade säsonger; `seasonSpanLabel` även här.

## 3 · 🟧 MINNE: "Cupfinalen förlorades 4–6" — men ni åkte ut i SEMIFINALEN

Minnesraden ljuger om vilken runda det var. Copy/data-bugg i minnesgeneratorn — kodverifiering.

## 4 · 🟨 Träning: "Senaste"-listan osorterad

"Omg 1 → Omg 4 → Omg 3" — varken stigande eller fallande. Sortera fallande (senaste först).

## 5 · 🟨 Tab-overflow (samma som Transfers Del 9 §2)

Sex tabbar, TRÄNARE utanför skärmen utan scroll-affordans. Samma fade-lösning.

## 6 · 🟨 Tränare-belastning: tom sparkline kvarstår (06-09 §3.2 EJ åtgärdad)

Platt grön linje i stort kort, säsong 1. Regeln finns redan beslutad: < MIN_POINTS → status-rad ("Frisk · ingen belastning än"). Påminn Code.

## 7 · 🟨 🎩 hattrick-ikon i Minne — off-map (när den väl syns)

Charmig men utanför kartan; Minne-tidslinjens ikonset bör beslutas när kontrast-buggen är fixad.

## Försoningslista

| # | Fynd | Prio |
|---|---|---|
| 1 | Minne-kontrasten (oläslig flik) | 🟥 kod |
| 2 | Tomma fornsäsonger bort + 2026/27-format | 🟧 |
| 3 | "Cupfinalen" ≠ semifinal — minnesgeneratorn | 🟧 kod |
| 4 | Senaste-listan sorteras | 🟨 |
| 5 | Tab-overflow-fade (delas med Transfers) | 🟨 |
| 6 | Belastnings-sparkline → status-rad (påminnelse) | 🟨 |
| 7 | Minne-ikonsetet beslutas efter kontrastfix | 🟨 |

**Till steg 3:** Klubb-domänen visar högst fix-landningsgrad av alla (4 av 6 stora 06-09-fynd åtgärdade) — och samtidigt den enda 🟥-buggen som gör en hel flik obrukbar. Audit-loopen fungerar; regressions-skyddet saknas.

— Design-Claude (Fable), del 10


---

# KAPITEL 11

# AUDIT — Visuell konsekvens · Del 11: Spelarmodal · Snabbsim · Portal omg 2 · In-match-interaktioner

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 7 screens (PlayerCard · Granska efter snabbsim · Portal omg 2 · byte under match · snabbändring · halvtid Taktik · halvtid Byten)

## 0 · Verifierat rent / starkt

- ✅ **PlayerCard-modalen är fin**: porträtt i copper-ring, terse egenskaper (4 attribut), utvecklingspotential med ålder, Dubbelliv (Sjuksköterska · flexibilitet 98%), kursiv bio, "Har inte spelat några matcher än" ✓ rätt tomtillstånd, centrerad ljus modal utan blur ✓ kanon
- ✅ **Portal omg 2 har rond-kontext**: "Omgång 2 av 22. Position 1 med 2 poäng." + round-character-quote ("Första segern. Omklädningsrummet lät inte likadant efteråt.") — vardagsrytm-bandet lever
- ✅ **Halvtid TAKTIK** återanvänder Förbered-taktikens segmentstil ✓ konsekvent · resursräknare ("3 kvar", "0/3 byten") ✓ ärliga begränsningar
- ✅ Snabbsim-Granska populerar TABELL (1:a) + FORM — Del 3 §6-tomkorten självläker med seriedata ✓

## 1 · 🟧 Löneenheten är inkonsekvent: tkr/säsong vs tkr/mån

PlayerCard: "Lön: **6 tkr/säsong**" · Kontraktsförfrågan: "19 **tkr/mån**" · Tränaravtal: "24 **tkr/månad**". Tre ytor, två enheter (och två stavningar av månad). Spelaren kan inte jämföra löner — det är ekonomisystemets kärnjämförelse. **Försoning:** EN enhet överallt (tkr/mån ligger närmast verkligheten) + en formatter-helper, samma klass som positionLabel (Del 7 §1).

## 2 · 🟧 "Sorterat på form" — men listan är sorterad på ork

Halvtid BYTEN: "Startande (sorterat på form)" — raderna visar styrka + procent och är sorterade på PROCENTEN (71→13%). Procenten är ork/energi, inte form (form = säsongsvärdet i Portal-statsraden). Vokabulärkollision: "form" betyder nu två saker. **Försoning:** etiketten "sorterat på ork" + mikro-legend "styrka · ork %". Gäller även VÄLJ UT-SPELARE-modalen (⚡31 oförklarad).

## 3 · 🟧 SNABBÄNDRING är en bottom-sheet — kanon säger centrerade modaler

In-match-taktikpanelen dockar i botten. Regel #8: "Modals are centered, not bottom-sheets." MEN: under pågående match är dockningen funktionellt RÄTT — tavlan och flödet förblir synliga. **Beslutsfråga, inte buggfix:** ratificera en distinkt in-match-komponent ("matchpanel — dockad, inte modal") i DESIGN-DECISIONS, eller centrera. Min rek: ratificera dockningen för in-match-snabbval, behåll centrerat för allt annat.

## 4 · 🟧 Decimaler + oförklarade kolumner i byteslistorna (Del 7 §6 bekräftad)

"H. Hage (B) · 46.1 · 71%" — decimal-styrka igen, och varken 46.1 eller 71% har rubrik. Heltal + mikro-legend.

## 5 · 🟨 Layout-bugg: "MATCH PÅGÅR"-bannern klipper modal-CTA:n

Halvtid BYTEN: ANDRA HALVLEK-knappen ligger delvis bakom den vita bannern. Z-index/safe-area — bannern ska gömmas när modal är öppen.

## 6 · 🟨 Emoji på knappar — instanserna fortsätter

🔄 i "ANDRA HALVLEK →"-CTA:n och VÄLJ UT-SPELARE-titeln · 💡 Rekommendation · ⚡ som ork-ikon · PlayerCard-knappraden (😴🎓📣🙂💪🔮 — 🔮 off-map). Samma försoning som tidigare: chrome/knappar = Lucide eller inget.

## 7 · 🟨 Gold-milstolpe instans 2 (Ville Ljungberg) — Del 4 §3 är mönster

Varje hattrick får gold. Bekräftar inflationen; copper-försoningen brådskar.

## 8 · 🟨 Story-slot-rotation: Kafeterian-kortet identiskt två omgångar i rad

Samma scen, samma text omg 1 → omg 2. Kurerings-handoffen satte rotation på frekventa typer — verkar inte aktiv. Kodverifiering.

## 9 · 🟨 Hallgren-budet kvarstår obesvarat sedan tre matcher utan tryck

"Svar krävs" men ingen deadline syns. Transfer-specarna hade `expiresRound` — om den finns, visa den ("svar senast omg 3"); om inte, gameplay-lucka (beslut utan kostnad för att ignorera).

## Försoningslista

| # | Fynd | Prio |
|---|---|---|
| 1 | Löneenhet → tkr/mån överallt (formatter-helper) | 🟧 |
| 2 | "Form" vs ork — etikett + legend i byteslistor | 🟧 |
| 3 | In-match-dockad panel: ratificera eller centrera | 🟧 beslut |
| 4 | Decimaler bort + kolumnrubriker i byteslistor | 🟧 |
| 5 | Banner-överlapp över modal-CTA | 🟨 kod |
| 6 | Knapp-emoji → Lucide (instanser) | 🟨 |
| 7 | Milstolpe-gold → copper (mönster bekräftat) | 🟨 |
| 8 | Story-slot-rotation verifieras | 🟨 kod |
| 9 | Bud-deadline synliggörs (expiresRound) | 🟨 |

**Till steg 3:** två nya helper-kandidater till skördelistan — löne-formatter och ork/form-vokabulären. Mönstret står sig: divergens uppstår exakt där delad primitiv saknas.

— Design-Claude (Fable), del 11 (sista capture-batchen)


---

# KAPITEL 12

# AUDIT — Visuell konsekvens · Del 12: Omg 5 — derby-portal · data-fyllda vyer

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 5 screens (Portal omg 5 m. derby · Tabell · Statistik · Trupp NU · PlayerCard Ros)

## 0 · Verifierat — systemen blommar med data

- ✅✅ **Derby-primary-varianten är implementerad**: 🔥 FORSDERBYT · IMORGON, datum/arena/klack-mood, egen CTA — R3+-vokabulären i seriespel
- ✅✅ **Efterklang med 2 trådar**: Helena (journalist, premiss + eko) + Thomas Bäck (nemesis) — flödesstrukturen bär flera trådar precis som designat
- ✅✅ **PlayerCard-betygsgrafen är EXEMPLARISK**: senaste 5 med värden (6.5→8.0→9.0), motståndarkoder, V-markering, "Stigande form"-läsning — så här förankras en graf (kontrast: Stämningskurvan är fortfarande naken, Del 7 §3)
- ✅ Tabellen har position-trendpilar (1▲ 2▼) · Statistikens snittbetyg-sektion populerad + egna spelare copper-markerade · seasonContext-bandet ("Knapp ledning. Tvåan andas i nacken.") · Karriärresa i PlayerCard ("Storspelad match mot Karlsborg")
- ✅ Motståndarform-kortet (SÖDERFORS FORM, resultatboxar + "2:a · 6p") — bra derby-förberedelse

## 1 · 🟧 DUBBEL derby-signal — två kort säger samma sak

Primary-kortet (FORSDERBYT · IMORGON, full info + CTA) följs direkt av ett äldre notis-kort ("⚔ DERBY / 🔥 Derby nästa omgång! Forsderbyt / …Intensiteten kommer vara hög."). Det andra kortet är pre-R3+-generationens derby-notis som skulle ersättas av varianten. **Försoning:** notis-kortet bort när derby-primary renderar.

## 2 · 🟧 Två primära CTA:er på derby-portalen

"Sätt lineup för derbyt →" (copper-fylld i kortet) + "REDO — SPELA OMGÅNG 5 →" (copper skärm-CTA). Regel #5: en primär per skärm. Och skärm-CTA:n säger "REDO" innan lineup är satt — vilseledande state. **Försoning:** skärm-CTA:n speglar state ("VÄLJ TRUPP FÖRST" disabled-stil → "REDO" när klar), kortets knapp blir outline när skärm-CTA:n är primär — eller kortet pekar och skärm-CTA:n är enda primären.

## 3 · 🟧 Statsraden blandar nu TRE representationer

KLACKEN "redo" (ord) · KONDITION (naken sparkline, nu röd) · FORM 65 (tal) · KASSA 425 tkr (tal). Del 5 §7 har växt: en rad, tre språk. **Försoning:** numeraler i raden (kanon); trender får egna förankrade grafer där de förtjänas (PlayerCard-modellen).

## 4 · 🟨 REVIDERING av Del 8 §3: 🔥 i tabellen är sannolikt DERBY-markör — behåll men förklara

Med derby mot Söderfors nästa omgång är 🔥 på Söderfors-raden korrekt kartbetydelse (🔥 = Derby). Inte bort — **in i tabell-legenden**: "🔥 = derby nästa omgång". (Transfers-🔥 "1 klubb intresserad" är fortfarande fel användning.)

## 5 · 🟨 "Historik: —" i derby-kortet

Tom struktur-instansen igen. Första mötet förtjänar copy, inte ett streck: "Första mötet i år." (Håll-mönstret.)

## 6 · 🟨 Småfynd

- **Kondition 0 men "Frisk · Tillgänglig"** (Ros) — helt slut spelare utan varning; borde trigga vila-nudge (gameplay)
- **"Säsong 2026"** i Karriärresa — 2026/27-formatet (samma fix som Minne, Del 10 §2)
- **"Lön: 15 tkr/säsong"** — löneenheten (Del 11 §1, instans 2)
- **Helena-premissen upprepar namnet** ("Du gav Helena Wikström…" under rubrik HELENA WIKSTRÖM) → "Du gav henne ett rakt svar efter Forsbacka, omg 2."
- **Kafeterian identisk tredje+ omgången** — rotationen definitivt inaktiv (Del 11 §8 skärpt)
- **Motståndarform-boxarna** visar motståndarnamn på 3 av 4 — konsekvent på alla
- **Betygs-displayen (grön 9.0)** i PlayerCard ser LED-aktig ut — verifiera mot LED-reservatet; Georgia räcker

## Försoningslista

| # | Fynd | Prio |
|---|---|---|
| 1 | Derby-notiskortet bort när primary-varianten renderar | 🟧 |
| 2 | En primär CTA på derby-portalen + state-ärlig skärm-CTA | 🟧 |
| 3 | Statsraden → numeraler (tre språk → ett) | 🟧 |
| 4 | 🔥 = derby in i tabell-legenden | 🟨 |
| 5 | "Historik: —" → copy | 🟨 |
| 6 | Småfynd (kondition-varning, säsongsformat, lön, premiss-copy, rotation, boxlabels, LED-betyg) | 🟨 |

**Till steg 3:** PlayerCard-betygsgrafen är nu det fjärde skördade mönstret (graf-förankring: värde + labels + läsning). Mönsterkvartetten — Tabell-legenden · Håll-raden · FRIA-tomtillståndet · PlayerCard-grafen — täcker tillsammans alla återkommande klassfynd i auditen.

— Design-Claude (Fable), del 12


---

# KAPITEL 13

# AUDIT — Visuell konsekvens · Del 13: Taktik-flikar · Inbox · Sen säsong · Slutspel → SM-final

**Build:** 050bb22 · **Datum:** 2026-06-10
**Subjekt:** 15 screens (Taktik Formation/Kemi/Anteckningar · Inbox omg 7 · Portal omg 10/18 · Annandagen · Halvvägs · Trupp omg 18 · Grundserien avklarad · KF-portal · SF-skärm · SM-final-portal · SM-final-uppspel · Lagpresentation)

---

## 0 · Verifierat — sen-säsongs-systemen levererar

- ✅✅ **Annandagen-illustrationen är LIVE och vacker** — full-bleed vinterbygd, ⬩ ANNANDAGEN ⬩. Illustrationsdomänregeln i praktiken; precis så här skulle ögonblicken kännas
- ✅✅ **SM-final-portalen följer R3+ nästan exakt**: illustration i NextMatchCard (Studenternas IP), **gold-CTA "REDO — SPELA SM-FINAL"** (btn-gold på rätt och enda plats ✓), Uppsala som finalort ✓, väder, "Det är dags"-knapp. Klimax-eskaleringen är inne
- ✅✅ **Cooldown-korten** (Kommunen/Mecenaten/Lokaltidningen: kursiv vilo-rad + "N OMGÅNGAR KVAR" + dot-räknare) — konsekvent mönster över tre system, fin tystnadsdesign
- ✅ **Manager-burnout-bandet** ("JACOB BERGSTRÖM ÄR TRÖTT" + citat + röd ram) — nytt system, synligt och återhållet · Efterklang med RELATION-sparkline ✓ · Kemi-flikens legend (grön/röd koppling) + parlista ✓ · "Grundserien avklarad"-skärmen är ren och fin (placering-hero, topp 8, bracket) · Halvvägs-beatens copy ("Förra månaden hoppades vi. Nästa månad räknar vi.") är systemets röst som bäst · Trupp-tomsektioner med kursiv ✓ ("Ingen avstängd." / "Truppen är på topp.")

## 1 · 🟥 SM-final-UPPSPELET raserar det R3+ byggde

Sekvensen: gold-portal (✓ ceremoni) → **svart skärm med jättestor 🏆-emoji + konfetti + "NÄSTA →"-pill** → nästan tom Lagpresentation. Tre brott i ett: (a) **emoji som hero** — README: emoji är typografiska element, "no 🎉 confetti on the champion screen; that's what CSS particles are for" — och illustrationssystemet ÄR lösningen för ögonblick (jfr Annandagen!); (b) **konfetti FÖRE avspark** — konfetti är segerns vokabulär, här firar spelet en match som inte spelats; (c) **"Säsong 2026"** — fel format igen. Lagpresentationen därefter: två kort + CTA i ett svart hav — tomrum utan ceremoni. **Försoning:** uppspels-sekvensen får illustration (final-bilden finns ju!) eller typografisk ceremoni i scen-vokabulären (⬩-eyebrow, Georgia, stripe), konfetti sparas till guldet, lagpresentationen komponeras (sköldar + meriter centrerat, à la matchup-kortet i KF-portalen som redan är rätt). Prio: 🟥 — det är spelets största ögonblick, och det är den svagaste ytan i builden.

## 2 · 🟥 Inbox-inflationen är ett gameplay-fynd, inte bara design

**36 olästa efter 7 omgångar** (~5/omgång). Innehållet avslöjar varför: "Träning omg 3/4/5/6: Fysik" — fyra identiska rapporter; matchresultat som redan upplevts i Granska; "Skutskär efter matchen" två gånger. Semafor-emojin (🔴🟡⚪, Del 6 §2) och dubbel-ikonerna bekräftas. **Försoning (design):** token-dots + en ikon per rad. **Försoning (gameplay, till Opus):** notis-dieten — träningsrapporter aggregeras ("Träning omg 3–6: Fysik, inga incidenter" EN rad), matchresultat som spelaren själv spelat går inte till inkorgen, repetitiva pressklipp slås ihop per omgång. Inkorgen ska vara "det jag kan ha missat", inte en logg över allt.

## 3 · 🟧 Anteckningar-fliken: samma mening fem gånger

"X behöver vila — det är ingen skam i det." ×5 ordagrant (Löv, Ros, Holm, Virtanen, Kronqvist). Copy-poolen har en sträng för TRÖTT. Systemröst-brott — assistenten låter som en bandspelare. **Försoning:** 4–5 varianter i pool + max 3 individuella kort, resten aggregeras ("Ytterligare 4 i samma läge — rotera mot Rögle"). MB-summeringen ("7 spelare att hålla koll på") finns redan och är rätt — låt den bära mer.

## 4 · 🟧 Taktik-pitchen: låg kontrast (Jacobs fynd bekräftat)

Plan-rektangeln är nästan samma valör som papperet (ljusbeige på ljusbeige, hairline-linjer) — cirklarna flyter i tomma intet. Kemi-grafens linjer syns men positionerna förlorar förankring. **Försoning:** mörka pitchen ett steg (befintlig `--bg-elevated`/grön-tonad yta) eller ge den is-blå ton (det ÄR is) + tydligare mittlinje/målgårdar. Förståelse-frågan (vad kemi-linjerna betyder för matchen, vad formationsvalet gör) parkeras som UX-fråga till senare per Jacobs notering — men kontrasten är ren visuell försoning, fixas nu.

## 5 · 🟧 Pill-CTA-strata växer: "STARTA SLUTSPELET →" / "STARTA SEMIFINALERNA →" / "NÄSTA →"

Slutspels-mellanskärmarna använder pill-CTA:er (99px) — samma drift som onboarding (Del 1 §2) och beats (Del 5 §2). Nu belagt i fyra generationer. `.btn-cta` 12px är ratificerad; en svep-PR över alla pill-CTA:er.

## 6 · 🟧 Skadade-porträtten i Trupp är överdimensionerade

Två skadade = två kort à ~280px höjd där porträttet fyller ~70% och informationen ("Borta 9 dagar till") kläms i marginalen. Kanon: porträtt 36px cirkel i rader; NU-flikens skadekort i mocken hade porträtt + narrativ i balans. **Försoning:** porträtt 48–64px vänster, namn + dagar + narrativ höger — kortet ≤ 80px högt. (Porträtten i sig: rätt stil, fel skala.)

## 7 · 🟨 Småfynd

- **"Fokusera"/"Det är dags"-knappar** (KF/SM-portal) — sentence case på knapp; kanon UPPERCASE för CTA, eller outline-sekundär. Liten men i ceremoni-ytan
- **KONDITION-sparkline röd naken** i statsraden (Del 5 §7/Del 12 §3 bekräftad — nu också ALARMERANDE röd utan kontext: är 0 eller 50?)
- **🏆-emoji i headerns "SM-Final · match 1"-pill** — av kartan OK (🏆 Cup) men i fas-pillen blir det dubbelt med gold-tonen; valfri
- **Kemi-fliken visar bara gröna par** — finns svaga (röda) par renderas de? Verifiera att listan inte filtrerar bort det viktigaste (varningarna)
- **Inbox "Utse kapten — Leif Leifsson?"** ligger kvar oläst från 17 okt i omg 7 (nov) — beslutsnotiser utan deadline ackumuleras; samma klass som Hallgren-budet (Del 11 §9)

---

## Rangordnad försoningslista (Del 13)

| # | Fynd | Prio |
|---|------|------|
| 1 | SM-final-uppspel: emoji-hero+konfetti → illustration/scen-vokabulär; lagpresentation komponeras | 🟥 |
| 2 | Inbox-dieten (gameplay till Opus) + token-dots | 🟥/🟧 |
| 3 | Anteckningar: copy-pool + aggregation | 🟧 |
| 4 | Taktik-pitch kontrast (is-ton) | 🟧 |
| 5 | Pill-CTA-svepet (nu 4 generationer) | 🟧 |
| 6 | Skadade-kort: porträtt-skala | 🟧 |
| 7 | Småfynd (knapp-casing, kondition-röd, kemi-röda par, besluts-ackumulering) | 🟨 |

**Till steg 3:** Annandagen + SM-final-portalen bevisar att ceremoni-systemen fungerar när de följs — och uppspels-skärmen visar exakt vad som händer i glappet mellan två ratificerade system (illustration fanns inte → emoji fyllde tomrummet). Samma lärdom som alltid: där primitiven saknas improviserar koden.

— Design-Claude (Fable), del 13


---

# KAPITEL 14

# AUDIT — Visuell konsekvens · Del 14: SM-guld → säsongsskarv → säsong 2027/28

**Build:** 050bb22 · **Datum:** 2026-06-11
**Subjekt:** 10 screens (Guld-scen · Kafeterian post-final · Sommaren-beat · Årsbok · Klubbhistorik ×4 flikar · S2-portal · Kontrakt S2)

---

## 0 · Verifierat — säsongsskarven håller ihop

- ✅✅ **Guld-scenens COPY är buildens finaste**: "det här är inte en match till — det här är säsongen som blev allt" + klackledar-citatet ("Förr i tiden sa man att det inte gick att slå storstaden. Sen kom du."). Gold-Georgia-rubrik, konfetti **nu legitim** (seger!), gold-CTA — guldreservatet används rätt
- ✅✅ **Årsboken är rik och rätt**: ÅRSBOK-eyebrow, **"SÄSONG 2026/27" — rätt format!**, Säsongens match med "Spara som bild" (delbarhet!), Din säsong-tidslinje, Säsongens bästa, streaks, poängkurva, orten 100, ekonomi-delta. Strukturen bär mängden
- ✅✅ **Brev-fliken**: Ingrid Johanssons änke-brev + Jacobs svar — spelets hjärta i en skärm. Skoluppgiften (Bo Dahlqvist) likaså. Klubbminnet LEVER nu (Del 10 §1-kontrasten åtgärdad eller annan vy)
- ✅ **Säsongsrullningen**: masthead "Jacob · 2027/28" ✓, Bandygalan-decision (Gå/Skippa = primär/outline ✓), Bergskurvan-kortet (klack-mood + medlemmar) ✓, KONTRAKT-tabben med notis-dot ✓, "Transfermarknad öppen" med token-dot ✓

## 1 · 🟧 🏆-emoji-heron även på guld-scenen (A3-mönstret)

Samma jätte-emoji som uppspelet — nu på spelets största skärm. Allt annat på scenen är rätt; trofén är den enda AI-slop-komponenten. **Försoning:** trofé-illustration (köa i illustrations-beställningen: "SM-pokalen, gold-gradering, mörk bakgrund") eller ren typografisk ceremoni (gold-⬩-eyebrow + Georgia räcker — copyn bär). Samma fix-familj som A3.

## 2 · 🟧 "I DETTA ÖGONBLICK" används för TVÅ olika saker

Guld-scenen ("I DETTA ÖGONBLICK" + trofé) och Kafeterian (samma eyebrow + ☕) delar etikett — men den ena är karriärens höjdpunkt, den andra en tisdagsfika. Eyebrown devalverar guldet och överhöjer fikan. **Försoning:** scen-eyebrows speglar innehållet: guldet får "⬩ SVENSK MÄSTARE ⬩" (rubriken som eyebrow-nivå), vardagsscener får "⬩ I DETTA ÖGONBLICK ⬩". Plus: Kafeterians ☕-emoji bort (Del 5 §6).

## 3 · 🟧 Årsbokens tidslinje-copy: samma mening fyra gånger

"Stor seger mot X (N–N) · En övertygande seger med N måls marginal. Laget visade klass." ×4 nästan ordagrant — samma klass som Anteckningar (Del 13 §3). Och numreringen är inkonsekvent: 01 · 06 · 07 · **018 · 022 · 033** (nollpaddningen växer fel). **Försoning:** copy-pool för seger-varianter + tvåsiffrig paddning (01…22, 33 → "Gala").

## 4 · 🟧 Kontraktsraden blandar TVÅ valutaformat

"B · 45 tkr · 15 666 kr/mån · t.o.m. 2027" — tkr (värde) och kr/mån (lön) på samma rad, och lönen med kronprecision (15 666) mot spelets tkr-konvention. Löne-formatter-fyndet (Del 11 §1) utvidgat: **EN konvention: "Värde 45 tkr · Lön 16 tkr/mån"**. Heltal, tkr överallt.

## 5 · 🟨 Lagfoton-fliken visar fel innehåll

Fliken renderar en år-pill + samma säsongssammanfattnings-kort som Säsonger-fliken — inget foto, ingen placeholder. Om lagfotot inte genererats än: tomtillstånd enligt FRIA-mönstret ("Lagfotot tas i oktober") eller image-placeholder. Just nu läser den som bugg.

## 6 · 🟨 Småfynd

- **Hall of Fame "Bästa snittbetyg": fem spelare à 6.5** — sannolikt avrundning till en decimal som planar ut; visa två decimaler eller sortera på fler kriterier, annars ser listan trasig ut
- **Emoji-raderna i säsongskortet** (📊🏒🏆⭐💰 per rad) — fungerar som årsboks-charm men är 5 emoji i ett kort; gränsfall mot B3-regeln, ratificeras med den
- **"Säsongens berättelser"** — rubrik + EN rad (Hallgren-galan, som redan står i tidslinjen). Dubblering; stryk sektionen tills den har ≥2 unika berättelser
- **Sommaren-beaten**: blur instans 4 (B2) — annars perfekt copy ("I oktober är det igång igen. Tills dess.")
- **59 notiser i inboxen** vid S2-start — inbox-inflationen (A8) över säsongsskarven: arkivera/nollställ vid nytt säsongsår
- **Kafeterian post-final**: halva skärmen tom under dialogen — scenen behöver bottenvikt (stäng-rad längre ner eller dialog centrerad vertikalt)

---

## Försoningslista (Del 14)

| # | Fynd | Prio |
|---|------|------|
| 1 | 🏆-emoji → illustration/typografi på guld-scenen (A3-familjen) | 🟧 |
| 2 | Scen-eyebrows differentieras (guld ≠ fika) + ☕ bort | 🟧 |
| 3 | Årsboks-tidslinje: copy-pool + numrering | 🟧 |
| 4 | Kontraktsrad: tkr-konvention, heltal (utvidgar Del 11 §1) | 🟧 |
| 5 | Lagfoton-tomtillstånd | 🟨 |
| 6 | Småfynd (HoF-decimaler, emoji-kort B3, berättelser-dubblering, blur, notis-arkivering, Kafeterian-vikt) | 🟨 |

**Del 14 stänger capture-fasen.** Kvar ofotat: Portal jan/mars + signatur, kris/nedflyttning, paussnack — tas vid tillfälle, blockerar inget. Konsoliderade kartan (FORSONINGSKARTA-KONSOLIDERAD-2026-06-10.md) gäller; Del 14 ändrar ingen prioritering men förstärker A3 (emoji-i-ceremoni är systemiskt, inte enskilt) och lägger två nya 🟧 i D-listan: scen-eyebrow-differentiering + kontrakts-valutan.

**Säsongsskarv-domen:** övergången 2026/27 → 2027/28 fungerar — årsbok, historik, brev, galan, nya kontraktslistan. Spelets minnes-arkitektur (det som byggdes i Klubbminne-arbetet) levererar i praktiken. Med guld-trofén som illustration och copy-poolerna breddade är det här en värdig säsongsfinal.

— Design-Claude (Fable), del 14 — capture-fasen komplett


---

# KAPITEL 15

# FÖRSONINGSKARTA — Visuell konsekvens, KONSOLIDERAD (Del 1–13)

**Build:** 050bb22 · **Datum:** 2026-06-10 · **Brief:** DESIGN-BRIEF-VISUELL-KONSEKVENS-FABLE-2026-06-10
**Underlag:** 13 del-audits, ~70 screens, hela appen utom: SM-guld-scen, säsongssammanfattning/BoardMeeting, Portal jan/mars + signatur, kris-scen, paussnack (= Del 14 när spelstate finns).

---

## A · TOPPLISTA 🟥 — bryter helheten, fixas först

| # | Fynd | Del | Ägare |
|---|------|-----|-------|
| A1 | **Wiring-redovisning**: Förbered = legacy trots klar-rapport · Match = halvt wirad (dubbel krom) · Granska = pre-fork. Code redovisar per yta vilken commit som påstods innehålla vad | 2–3 §0 | Code |
| A2 | **Dubbel krom på match-skärmar** — 4 staplade headerband som dessutom motsäger varandra ("Omg 1" vs "OMG. 2"). Legacy göms på wirade skärmar + EN omgångsdefinition (serieomgång) | 3 §1–2 | Code |
| A3 | **SM-final-uppspelet**: 🏆-emoji-hero + konfetti före avspark + tom lagpresentation — spelets största ögonblick är buildens svagaste yta. Illustration/scen-vokabulär + konfetti sparas till guldet | 13 §1 | Design-mock → Code |
| A4 | **MINNE-fliken oläslig** (vit-på-vit) — klubbens själ är osynlig | 10 §1 | Code |
| A5 | **Positionsvokabulären**: MV/B/YH/MF/A vs engelska vs GOA/DEF/HAL — tre strata. EN `positionLabel()`-helper | 4 §1, 7 §1 | Code |
| A6 | **CTA-pillen**: onboarding + beats + slutspels-mellanskärmar = 4 generationer pill-CTA. Svep-PR → `.btn-cta` 12px uppercase | 1 §2, 5 §2, 13 §5 | Code |
| A7 | **RPS-stripens semantik**: fel aktiv fas i Förbered-wizard + ⊘ läser som förbjuden → ✓/⬡-kanon | 2 §1 | Code |
| A8 | **Inbox-inflationen**: 36 olästa/7 omg — notis-diet (aggregera träningsrapporter, inga egna matchresultat, slå ihop pressklipp) + semafor-emoji → token-dots | 6 §2, 13 §2 | Opus (diet) + Code |

## B · BESLUTSFRÅGOR — Jacob/Opus ratificerar, sedan kod

| # | Fråga | Min rek | Del |
|---|-------|---------|-----|
| B1 | **Vi/dom-LED-kodning** (amber=vi, is=dom) — konsekvent genomförd, gör ett jobb. Ratificera som ny scoreboard-kanon (med `--led-us`/`--led-them`-roller) eller återställ röd? Georgia-namn-över-LED står fast oavsett | Ratificera | 3 §3, 5 §1 |
| B2 | **Beat-blur** (Helgen, Pokalen, Halvvägs = 3 instanser) — kanon säger no-blur/scrim | Scrim | 4 §2, 5 §3 |
| B3 | **Emoji-regeln, ny formulering**: emoji = domänkategorier på översiktsytor · Lucide = chrome/knappar · inget = data-sektioner inuti rapporter. Löser båda riktningarna (läckage in i chrome + försvinnande ur etiketter) | Ratificera | 2 §4, 4 §5, 6 §2 |
| B4 | **Sektionsetiketter utan emoji i Granska-generationen** — del av B3; den nya normen är bättre | Ratificera nya | 4 §5 |
| B5 | **In-match-dockad panel** (SNABBÄNDRING) vs centrerade modaler | Ratificera dockning för in-match | 11 §3 |
| B6 | **Bury Fen som studio-vinjett** — README kallar den deprecated; den lever. Ratificera roll + EN plats (intro) | Ratificera | 1 §1 |
| B7 | **Serif på lägesknappar** (Bygg/Håll/Toppa/Vila) — ledarord-ceremoni eller drift? | Sans | 7 §4 |
| B8 | **Disabled-state-regel** — saknas helt; två generationer oläslig beige | Fylld @ 40% opacity, ratificera | 1 §3, 2 §2 |

## C · MÖNSTER ATT RATIFICERA (skördade ur builden — skriv in i DESIGN-DECISIONS)

1. **"Ett kort utan innehåll renderas inte — eller talar."** Kanon-exempel: Håll-raden ("Ingen reagerar. Hela truppen följer Håll.") och FRIA-tomtillståndet ("dyker upp vid säsongsslut"). 6 instanser av brott belagda.
2. **"Semantisk färg kräver nyckel."** Kanon-exempel: tabell-legenden + shotmap-legenden. 4 instanser av brott (pitch-ringar, nyckelmoment, styrka-färger, DIREKT-pills).
3. **"En graf förankras: värde + period + läsning."** Kanon-exempel: PlayerCard-betygsgrafen. Brott: Stämningskurvan, KONDITION-sparklinen, belastnings-sparklinen.
4. **Cooldown-kortet** (kursiv vilo-rad + "N omgångar kvar" + dots) — redan konsekvent över 3 system; skriv in som komponent.
5. **Delade primitiver att bygga** (divergensens rot): `positionLabel()` · löne-formatter (tkr/mån) · decision-card (Portal-varianten) · TabBar (klar i Klubb/Transfers/Tabell — sista: LedgerFrame-tabbar) · severity-dots (ersätter semafor-emoji) · disabled-state.

## D · 🟧-LISTA per domän (fixas i wiring-ordning)

- **Onboarding:** disabled-CTA (B8) · svårighets-taggar → `.tag`-pill + tokens · NEUTRAL PLAN-dubblett
- **Förbered:** ersätts av LedgerFrame (A1) — överlevande fynd: pitch-ringlegend permanent vid planen · taktik-trestate (dot räcker)
- **Match:** LED-tavlan → Georgia-namn över (B1 avgör sifferfärg) · LED-rött ut ur halvtidsmodal · BottomNav göms · "MATCH PÅGÅR" state-byte efter FT · banner-överlapp halvtid
- **Granska:** ersätts av recut (A1) — överlevande: tomma kort (C1) · decision-card (C5) · hörn-terminologi
- **Portal:** derby-dubbelsignal (notiskort bort) · två primära CTA:er · statsraden → numeraler · bud beslut+status = ett kort · story-slot-rotation verifieras · premiss-copy ("henne", inte namnet igen)
- **Trupp:** drag-hint → pitch-kontext · Stämningskurvan förankras (C3) · skadade-porträtt skala (64px, inte 70% av kort) · Anteckningar copy-pool + aggregation · taktik-pitch kontrast (is-ton)
- **Tabell:** dubbla beskrivningsrader · tom snittbetyg → status-rad · 🔥 = derby in i legenden
- **Transfers:** MV-kollisionen ("Värde X tkr") · tab-overflow-fade · Legend-låset förklaras
- **Klubb:** tomma fornsäsonger bort · "Cupfinalen"≠semifinal (minnesgeneratorn) · belastnings-sparkline → status-rad
- **Inkorg:** A8 + en ikon per rad · RPS-strip göms · besluts-notiser med deadline ("Utse kapten" låg 5 omg)
- **Slutspel:** "Fokusera"/"Det är dags"-casing · Kemi-fliken: renderas röda par?

## E · README/kanon-DRIFT (instrumentet självt — uppdateras EFTER B-besluten)

Tagline ("En ort. Ett lag. Ett mål.") · §Imagery föråldrad (illustrationssystemet + porträtt finns) · Bury Fen-status · 8px-etikett/36px-score (kända) · emoji-regeln (B3) · scoreboard-kanon (B1) · modal-regeln (B5) · disabled (B8).

## F · KODVERIFIERINGAR (grep-lista till Code)

Masthead-glyfen (alla screens) · italic-feedback-token i Taktik · 🏒 vs 🏑 i Spelguiden · Ros-stjärnan i betygslistan · hörn-grönt → token · story-slot-rotation · Kemi röda par · betygs-grönt vs LED-reservat.

## G · Kvar att fota (Del 14)

SM-guld-scen · säsongssammanfattning + BoardMeeting s2+ · Portal jan/mars + signatur aktiv · kris/nedflyttning · paussnacket.

---

**Helhetsdom:** Builden är inte i förfall — den är i *generationsskarv*. De nya systemen (Efterklang, kurering, beats, R3+, illustrationer, cooldowns, trupp-redesign) är inne och håller förbluffande väl. Driften är koncentrerad till (1) halvfärdig wiring, (2) ytor som aldrig fick design (uppspel, disabled, lagpresentation) och (3) saknade delade primitiver. Och två av "avvikelserna" var förbättringar värda att skörda (B1, B3/B4). Fixa A-listan, ratificera B, skriv in C — då är systemet starkare än före auditen.

— Design-Claude (Fable), konsoliderad försoningskarta


---

# KAPITEL 16

# DESIGNSLUTSATSER — Steg 3: är designen rätt? (Fable-genomgång efter audit Del 1–14)

**Datum:** 2026-06-11 · **Underlag:** 14 del-audits, ~80 screens av build 050bb22, en hel säsong genomspelad (premiär → SM-guld → säsong 2)
**Fråga:** Inte "följs systemet?" (det vet vi nu) utan **"är systemet rätt?"** — och var kan det bli bättre?

---

## I · DOMEN: designen är rätt. Tre bevis från evidensen.

Efter att ha sett varje yta i spelet med riktig data säger jag det utan reservation: **grundvalen håller.** Inte som smak — som observerat beteende:

**Bevis 1 — Systemet överlever kontakt med verkligheten.** Det klassiska testet för ett designsystem är inte mockarna utan vad som händer när riktig data, riktiga edge-cases och riktig spelartid trycker på det. Liggar-Granska, Efterklang-flödet, beats, cooldown-korten, Årsboken, derby-varianten — alla bär FULL data utan att spricka. Det som sprack (Orten pre-recut, Inboxen) sprack av *innehållsmängd*, inte av designspråket.

**Bevis 2 — Driften går mot systemet, inte från det.** Det mest talande fyndet i hela auditen: när koden improviserade utan design uppfann den INTE ett annat formspråk — den uppfann *dåliga versioner av vårt* (pill-CTA:er i copper, emoji där illustration saknades). Och två improvisationer var *förbättringar* (vi/dom-LED, emoji-fria dataetiketter). Ett system folk flyr ser inte ut så. Det här systemet är lätt att vilja följa och svårt att följa exakt — det är ett regelproblem, inte ett designproblem.

**Bevis 3 — Rösten är omisskännlig.** "Förr i tiden sa man att det inte gick att slå storstaden. Sen kom du." / "Ingen reagerar. Hela truppen följer Håll." / änke-brevet. Ingen annan produkt låter så här. Tonaliteten — bandysvensk understatement — är systemets starkaste tillgång och den har INTE driftat på 14 delar. Copy-disciplinen höll bättre än pixel-disciplinen.

**Alltså:** ingen omdesign. Principerna (nostalgi-med-jobb, förstärkning/kontrast, 70-tal-inte-1800-tal) är inte bara estetik längre — de har visat sig vara *operativa*: de förutsade korrekt vilka ytor som skulle kännas fel (emoji-trofén, konfetti-före-avspark) innan någon formulerade varför.

## II · VAR SYSTEMET ÄR SVAGARE ÄN SIN POTENTIAL — fem förbättringar

Det här är inte försoningsfynd (de ligger i kartan). Det här är ställen där systemet är *rätt men inte färdigt* — där nästa designinvestering ger mest.

### 1 · Ceremonitrappan har ett hål i mitten

Vi har vardagen (kort, liggare) och vi har topparna (illustration, gold, scener). Men auditen visade att spelet har en MELLANNIVÅ av ögonblick som idag faller mellan stolarna och improviseras: SM-final-uppspelet, lagpresentationen, "Grundserien avklarad", slutspels-mellanskärmarna. Alla blev svaga av samma skäl — de är för stora för ett kort och för små för en illustration.

**Förslag: ratificera en tredje ceremoninivå — "den typografiska scenen".** ⬩-eyebrow + Georgia-hero + stripe + max ett strukturelement (bracket, matchup, lista) på mörk yta. Inga bilder, ingen emoji, ingen konfetti. Den finns redan embryoniskt (Halvvägs-beaten, Pokalen-beaten är nästan den) — den behöver bara erkännas som komponentklass med regler, så att nästa mellanögonblick får ett hem istället för en 🏆.

### 2 · Spelets siffror saknar ett enhetssystem

Auditens mest repetitiva fyndklass var inte färg utan **enheter**: tkr/säsong vs tkr/mån vs kr/mån · 46.1 vs 46 · "Styrka" vs procent vs betyg · MV som två betydelser. Designsystemet definierar hur siffror SER UT (Georgia, storlekar) men inte vad de BETYDER och hur de skrivs.

**Förslag: en "Tal & enheter"-sida i DESIGN-DECISIONS** — lika bindande som färgtokens: pengar alltid tkr heltal, lön alltid /mån, styrka alltid heltal, betyg alltid en decimal, procent bara för ork (med ⚡-ersatt ikon), datum alltid "omg N" inom säsong. Detta är billigast av alla förbättringar och träffar varje skärm.

### 3 · Severity-språket är systemets nästa token-familj

Spelet kommunicerar ständigt "hur allvarligt är det här?" — och gör det idag med ett lapptäcke: stripes, pills, emoji-bollar, röd text, amber siffror, "I fara". Auditens fynd (semafor-recidiv, styrka-färger utan nyckel, Neutral-taggar) är alla symptom på att severity aldrig fick en egen skala.

**Förslag: ratificera EN severity-skala** (lugn → uppmärksamhet → brådska → kris) med fasta uttryck per komponentklass (stripe-färg, dot, tag) — så att en spelare efter tre omgångar omedvetet kan läsa allvarsgrad var som helst i spelet. Det är skillnaden mellan ett spel som *visar* information och ett som *kan läsas med ryggmärgen*.

### 4 · Illustrationssystemet behöver sin andra våning innan det skalar

Bilderna som finns är utmärkta — men auditen visade gapet: trofén, uppspelet, lagfotot, kris-scenen. Beställningslistan växer organiskt och riskerar bli ad hoc (illustration-creep var din egen varning).

**Förslag: lås illustrations-katalogen till en fast lista om ~10** (intro, final, annandagen, derby, nyårsbandy, guld-trofé, sommaruppehåll, kris, ankomst, årsbok-vinjett) och förklara den STÄNGD i DESIGN-DECISIONS — nya bilder kräver att en gammal utgår. Reservprincipen som redan styr guldet, applicerad på bilder. Då förblir varje bild ett ögonblick.

### 5 · Förståelsedjupet — den parkerade frågan är den största

Du parkerade den själv: taktik-flikarna är "svåra att förstå". Auditen bekräftar att det inte är ett taktik-problem utan ett mönster: kemi-linjer utan konsekvens, formationsval utan förklarad effekt, Bygg/Håll/Toppa utan synligt utfall, momentum utan spak (medvetet) — spelet har flera system som SYNS men inte LÄRS. Synlighetssprinten löste "finns det?"; nästa nivå är "förstår jag vad det gör åt mig?".

**Förslag: en "konsekvensrad"-konvention** — varje val-yta (formation, läge, taktik, mentorskap) får en rad i assistentens röst som säger vad valet gör i NÄSTA match: "5-3-2 mot deras 4-4-2: tryggare bakåt, färre kontringar." Det är inte tutorial, inte tooltip — det är MB som pratar, vilket spelet redan gör bäst av allt. En designrunda, stor spelupplevelse-vinst.

## III · VAD SOM INTE SKA RÖRAS

Lika viktigt. Dessa frestelser ska motstås:

- **Lägg inte till fler kortvarianter.** Två (sharp/round) + portal-ytan räcker — auditen hittade noll fall där en tredje behövts.
- **Inför inte mörkt läge / temaväxling.** Säsongstonaliteten ÄR temat. Ljus papper + mörk portal + mörk match är en dramaturgi, inte en setting.
- **Animera inte mer.** Beats, goal-flash och CTA-puls räcker. Spelets lugn är en feature.
- **Rör inte rösten.** Copy-poolerna ska breddas (repetitionsfynden) men tonen är klar. Ingen "förbättring" av den.

## IV · REKOMMENDERAD ORDNING

1. **Försoningskartans A-lista** (pågår — Code) — städa skarven
2. **B-besluten** (du/Opus, ett möte) — lås reglerna driften avslöjade
3. **Förbättring 2 + 3** (Tal & enheter, severity-skalan) — billiga, systemiska, skriv-bara
4. **Förbättring 1** (typografiska scenen) — en mock-runda från mig, sen komponent
5. **Förbättring 4** (illustrations-katalogen) — ett beslut + beställningslista
6. **Förbättring 5** (konsekvensraden) — egen designrunda när 1–4 satt sig

**Slutord:** Frågan var "är designen rätt?". Svaret efter 80 skärmar: ja — och den är dessutom *bevisat* rätt nu, vilket är mer än vi visste för en vecka sedan. Det som återstår är inte att designa om utan att designa FÄRDIGT: mellannivån, enheterna, severity-skalan, katalogen, förståelsen. Fem avgränsade investeringar, ingen av dem riskerar det som redan bär.

— Design-Claude (Fable), steg 3
