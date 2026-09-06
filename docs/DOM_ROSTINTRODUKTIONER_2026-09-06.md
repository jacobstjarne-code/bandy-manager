# DOM_ROSTINTRODUKTIONER — state-ägarskap och kontrakt

**2026-09-06 · Opus · svar på Codex arkitekturfråga (playalong-fynd med GPT)**

## Fyndet

Speltestet blev obegripligt när kort kom från personer eller avdelningar
(klacken, mecenat, sponsor m.fl.) som spelaren inte visste vilka de var, utan
att ha introducerats. Regel som ska införas: återkommande namngivna röster
måste vara introducerade innan de får tala, högst en ny introduktion per
matchdag.

## Frågan till Claude

Ska den pågående ledgerändringen (`storylineLedgerService` / `eventLedger`,
DOM_HANDELSELIGGAREN Fas 3) äga "har rösten introducerats"-state, eller ska ett
separat persistent `introducedVoices`-register läggas till och introduktionen
bara journalföras i ledgern? Codex rek: separata registret.

## Domen

**Separat persistent `introducedVoices`-register. Auktoritativt för grinden.
Ledgern journalför introduktionen som en HÄNDELSE men styr inte behörigheten.**
Codex rek bekräftad — och den är inte en preferens, den är påbjuden av den
stående regeln.

### Varför (och varför inte ledgern)

`DOM_LIGGARE_COOLDOWN_GRANS` drar redan gränsen för den här kodbasen:
`eventLedger` = kanon ("vad HÄNDE", läses av årsbok/press/historik),
`narrativeBeatLog` = cooldown ("har vi VISAT X nyligen"). Testet: HÄNDELSE→kanon,
VISNING→cooldown.

Röstintroduktionen lägger till en TREDJE axel som ingen av de två äger: GRIND
("får rösten tala"). Det är speltillstånd, i samma klass som `klackState` och
`activeArcs`, och hör hemma i saven — inte i berättelseloggen. Alltså:

- Introduktionen SKEDDE → `eventLedger` som HÄNDELSE (kanon, per stående regel).
  Berättaren kan callbacka den ("sedan klackledaren klev fram i höstas…").
- Rösten FÅR TALA → `introducedVoices` (gate-state på saven, auktoritativt).

Loggen får inte vara auktoritet för en UI-grind. Gör den det får den två herrar,
och en replay/komprimering/migrering av loggen kan tyst ändra vem som får tala.
Migreringen (gamla saves) blir dessutom en ren seed mot ett dedikerat fält i
stället för att tvingas syntetisera fejkade intro-händelser i historiken.

A:s lockelse (en sanningskälla, ingen dubbelskrivning) förlorar: det är inte
samma faktum. Det är en narrativ beat OCH en tillståndsflagga som råkar ske
samtidigt. Dubbelskrivningen är korrekt separation, inte en kostnad.

Not: detta är samma gräns Codex drog för brett en gång (i cooldown-domen ville
Codex svälja cooldown-logik in i eventLedger). Här landar Codex på den smala,
rätta sidan.

## Kontraktet (så Codex kan bygga utan mellansteg)

**`introducedVoices` — permanent register på saven.**
- Nyckel = `voiceId`. Värde = `{ stamp: fryst visningssträng (säsong + datum),
  via: 'tilltrade' | 'introkort' | 'migrerad' }`.
- **Permanent. Överlever säsongsrollover OFÖRÄNDRAD. Ligger UTANFÖR
  rollover-rebasklassen** (`matchday-rollover-axis-sweep`).
- **Spara ingen levande `matchday`-integer här.** En rebasad matchday skulle
  göra registret till nästa rollover-bugg och korrumpera provenensen. Frys
  stämpeln som historiskt faktum.
- Ligger bredvid `klackState`/`activeArcs` i gameplay-state (Code verifierar
  exakt hemvist i save-shapen).
- **Röst-id klubbscopade** (Codex byggt): `kassor-0` i Målilla räknas aldrig som
  samma person efter ett klubbyte — samma familj som `clubId`-domen.

**Introbudget — per-matchdag-räknare, SKILD från registret.**
- Max 1 ny introduktion per matchdag.
- NOLLSTÄLLS varje matchdag → ligger i rollover-managed state (cooldown-klassen,
  som andra per-period-budgetar). Blanda inte ihop med det permanenta registret.

**Grinden.**
- Kort/event från en namngiven återkommande röst kollar
  `introducedVoices.has(voiceId)`.
- Saknas → skjut UPP eventet (kasta inte), lägg i deferral-kö per `voiceId`, och
  emit ett introkort om matchdagens introbudget tillåter.
- Vid intro: skriv BÅDE beat i `eventLedger` (kanon, ny typ `voice_introduced`)
  OCH flagga i `introducedVoices` (grind). En uttömmande ledgerfunktion måste
  klassificera `voice_introduced` (Codex fångade som integrationslucka, kompletterat).

**Deferral.**
- Uppskjutna events blir behöriga tidigast NÄSTA matchdag (första egentliga
  uttalandet ≥ intro + 1 matchdag).
- Vakta staleness på kön (Codes impl-detalj — flaggad, inte löst här).

**Scope.**
- Gäller namngivna återkommande PERSONER och namngivna grupproster med ansikte
  (klackledare).
- Neutral Berättarröst och rena systemmeddelanden är UNDANTAGNA (ingen
  `voiceId` / exempt). Nyckeln: "har en namngiven identitet spelaren måste känna
  igen".
- Kollektivet "klacken" som ambient kraft (`klackState`) är INTE en röst som
  introduceras. En namngiven klackledare ÄR det.

**Seed och migrering.**
- Tillträdet seedar `{ styrelsen, assisterande_tränaren }` som introducerade.
- Mecenat: återanvänd befintligt introkort → markera introducerad när kortet
  visas.
- Gamla saves: seed styrelse + tränare som introducerade (Tillträdet skedde före
  featuren). Mecenaten markeras introducerad OM en mecenatrelation redan är
  etablerad i saven — att åter-introducera någon man redan känner är värre än
  att hoppa över introt.

## Codex fem regler — bekräftade, med skärpningar

1. Introduktionskort nu, första egentliga uttalande tidigast nästa matchdag. ✔
2. Händelser från ännu ej introducerade röster skjuts upp, inte kastas. ✔
3. Gäller återkommande personer och grupper, inte neutral berättarröst eller
   rena systemmeddelanden. ✔ Skärpt nyckel: namngiven identitet spelaren måste
   känna igen.
4. Gamla sparningar migreras: styrelse + tränare räknas introducerade efter
   Tillträdet. ✔ Utökad: även mecenaten om relationen redan är etablerad.
5. Supportergruppen (kollektiv) kräver ingen personlig intro; en namngiven
   klackledare måste presenteras. ✔ Går in i scope-raden ovan.

## Kod-verifieringspunkter (Codex/Code bekräftar i koden)

1. Var gameplay-state persisteras, så `introducedVoices` läggs bredvid
   `klackState`/`activeArcs` — inte i ledgern.
2. Finns en tillförlitlig signal att mecenaten redan mötts (för migreringen)?
   Om inte: default introducerad-om-mecenat-finns.

## Byggstatus (Codex 2026-09-06)

- Grinden + rollover-splitten gröna på första testerna.
- Röst-id klubbscopade, säkrat i kod.
- `voice_introduced` klassificerad i den uttömmande ledgerfunktionen (var en
  integrationslucka helbygget fångade).
- Migrationsfallen föll först på ett testfixturfel (kortnamn `malilla` i stället
  för klubbens riktiga id), inte mekaniken — rättat.
- Kärnbygget grönt: 27 nya/riktade tester + produktionsbygget (design-/innehålls-/
  anläggningsvakter) passerar. Egen commit, isolerad från Code:s `HistoryScreen.tsx`.

## Opus-handoff (parar mekaniken)

- **Introkort-copy per röst**, i respektive rösts register
  (`STICKINESS_COPY_REGISTER`, fem röster). Styrelse + tränare täcks av
  Tillträdet; mecenat har kort; klackledare + ev. sponsor/övriga namngivna
  behöver introtext. Opus skriver dem när röst-rostret är låst. Se
  `SPEC_ROST_ROSTER_2026-09-06.md`.
- **Röst-roster.** En kanonisk lista `voiceId` för "namngiven återkommande röst"
  behövs som enum. Se SPEC_ROST_ROSTER.

## Gränser

- Konsistent med `DOM_LIGGARE_COOLDOWN_GRANS` (HÄNDELSE→kanon) och
  `DOM_HANDELSELIGGAREN` (eventLedger = fundament). Introduktionen ÄR en
  HÄNDELSE och går till kanon; grinden är en tredje axel som lever i save-state.
- `introducedVoices` (permanent) ≠ introbudget (per-matchdag, nollställs). Samma
  split som kanon-vs-cooldown, tillämpad på gate-state.
