# SPEC — REGELBOKSANPASSNING M1 + M15 + M16 (Code-order)

**Datum:** 2026-07-03 · **Beslut:** Jacob 2026-07-03 ("regelboksanpassa" M1+M15;
"0–2 är rimligare" M16) · **Skriven av:** Fable · **Källa i regelbok:** SvBF
Regelbok 23/24 (PDF, se TEXT-AUDIT-PROTOKOLL termlista) + docs/kunskapsbas/REGLER.md
(verifiera mot den FÖRST — lärdom: gissa aldrig regel/datafält).

**Sekvens:** Del 0 → Del 1 → Del 2 → Del 3 → Del 4 (Fable). Del 1–3 kan gå i
samma commit-serie men Del 4 (svensk text) väntar på Del 2:s token-export.

---

## DEL 0 — FÖRE ALLT

Domän 1-textcommiten (73 rader, 18 filer) ska vara committad FÖRST — separat
commit, order i TEXT-AUDIT-PROTOKOLL.md LOGG 2026-07-02 kväll. Blanda inte
regelboksanpassningen med audit-rättningarna.

---

## DEL 1 — M1: Förlängning 30 → 20 min (matchCore.ts)

**Nuläge (kodverifierat):** OT-loop steps 62–81 (20 steg × 1,5 = 30 min),
sudden death (mål → yield + return). minute = 91 + (step−62)×1,5.
otGoalMod = weatherGoalMod × profileGoalMod × 0.85; attack ×1.15.

**Ändring:**
1. Loopgräns: steps 62–75 (13 steg = 19,5 min ≈ regelbokens 2×10). Ingen
   halvtidsmarkering i OT byggs (ingen text claimar halvor — bekräftat i audit).
2. Minutmappning oförändrad formel; sista ordinarie OT-minut blir ~110.
   ALLA hårdkodade "120" i OT/straff-stegen (yield minute: 120, penaltyStart-
   steget, avgjort-raden) → 110.
3. `overtimeEnd`-triggern (step === 81) → step === 74 (sista loopsteget).
4. **Omkalibrering:** kortare OT sänker andelen OT-avgöranden. Kör
   kalibreringssviten och justera otGoalMod (0.85) och/eller OT-attackboost
   (1.15) så att fördelningen OT-avgörande vs straffläggning i knockoutmatcher
   behåller nuvarande proportion (±3 %-enheter). Dokumentera före/efter i
   commit-meddelandet.
5. matchReducer/MatchLiveScreen: verifiera att inget UI hårdkodar step 81/82
   eller minut 120 (grep: "81", "82", "120" i match-relaterade filer — döm i
   kontext, siffrorna är vanliga).

**Text (görs av Fable i Del 4, Code rör inte svenskan):** overtimeStart-,
overtimeEnd-, penaltyStart-poolernas "30 minuter"/"120 minuter"-referenser.
Code levererar grep-lista: `grep -n "30 minuter\|120 minuter" src/domain/data/matchCommentary.ts`

## DEL 2 — M15: Utvisning 5/10 min diskret (matchCore.ts + matchUtils-typ)

**Nuläge:** `duration = 3 + floor(rand()*4)` steg = 4,5–9 min kontinuerligt.
All text säger "10 minuter". Regelbok: 5 min (lindrig) / 10 min (grov) /
matchstraff.

**Ändring:**
1. Diskretisera: utvisning är ANTINGEN 5 min ELLER 10 min.
   - Stegimplementering: lagra suspension-timers i MINUTER och dekrementera
     1,5/steg (eller ekvivalent) så att 5 och 10 blir exakta — inte "närmaste
     antal steg". UI/text ska kunna säga 5 eller 10 och tala sanning.
   - Fördelning: kolla FÖRST docs/kunskapsbas/DATA.md om Bandygrytan har
     foul-duration-fält (känd felkälla — läs, gissa inte). Finns data:
     kalibrera 5/10-mixen mot den. Finns inte: default 70 % 5-min / 30 %
     10-min, flagga som antagande i commit.
   - Grov-vikt: koppla gärna 10-min-sannolikheten till befintlig
     suspensionProfile ('intensitet' + sena/jämna lägen → oftare 10). Håll
     enkelt — en multiplikator, ingen ny mekanik.
2. **Total utvisningsbelastning bevaras:** snittminuter utvisning/match ska
   ligga kvar mot Bandygrytan-kalibreringen (SUSP_TIMING). Justera
   foulThreshold-konstanten om mixen flyttar snittet.
3. Matchstraff: BYGGS INTE nu. Skriv en rad i BACKLOG (idéer) — "matchstraff
   som sällsynt tredje utfall" — om det inte redan står där.
4. **Token-export till text:** suspension-steget exponerar durationMinutes
   (5 | 10) i commentary-vars som `{minuter}` OCH i MatchEvent.description-
   bygget. Trait-/context-commentary (getTraitCommentary suspension,
   context_suspension_*) får samma värde tillgängligt.

**Text (Del 4, Fable):** alla "10 minuter"-strängar i suspension-relaterade
pooler skrivs om mot `{minuter}` eller minutneutralt. Code levererar grep-
lista: `grep -rn "10 minuter\|tio minuter" src/domain --include="*.ts"`

## DEL 3 — M16: Landslagsuttag 0–2 (nationalTeamService.ts)

**Nuläge:** ALLTID 3–5 uttagna från managed club, oavsett nivå. Underminerar
"säsongens guldkorn"-premissen i landslagText.

**Ändring:**
1. Ersätt CALLUP_COUNT_MIN/MAX-logiken med FÖRTJÄNST-modell:
   - `LANDSLAGS_CA_TROSKEL` (ny konstant): spelare kvalar bara med
     currentAbility ≥ tröskeln (+ formkrav som idag). Kalibrera tröskeln så
     att en typisk bruksklubb får 0–1 uttagna och ett topplag 2. Cap = 2.
   - 0 uttagna är ett giltigt utfall: HELA callup-flödet (modal, notis,
     camp-effekter, frånvaro) ska no-op:a tyst vid 0. Ingen "ingen togs ut"-
     text byggs — tystnad är rätt ton.
2. SNUB-scenen (IckeUttagenScen): trigga för bästa spelaren STRAX UNDER
   tröskeln (t.ex. inom 5 CA) när 0 eller 1 tas ut — det är nu den blir
   dramaturgiskt sann.
3. FIRST_CALLUP_MEMORY (sig 60) blir genuint sällsynt — ingen ändring behövs,
   texten är redan omskriven (2026-07-03).
4. Verifiera activeNationalTeamCamp-hanteringen för tom playerIds-array.
5. multi-notisen ("Flera från samma bygd") kan nu bara betyda 2 — OK, "flera"
   täcker två. Ingen textändring.

## DEL 4 — TEXTBYTE (Fable, EFTER Del 1–2)

Kort riktad Fable-session: input = Codes två grep-listor (Del 1 + Del 2) +
tokennamnet från Del 2.4. Fable skriver alla ersättningsrader direkt i
filerna. Kända träffar som SKA med: suspension-poolen ("får 10 minuter för
bentackling"), getTraitCommentary hungrig-raden ("10 minuter. {name} ville
för mycket"), context_shorthanded_surviving ("Tio man i tio minuter utan att
släppa in"), context_suspension_frustration ("10 minuter — och det vid
{score}"), overtimeStart/End, penaltyStart. Efter bytet: uppdatera
regressionsgreppen i text-guard-planen med "30 minuter" och "120 minuter"
som bannade i matchtext.

## DEFINITION AV KLART

Build + test grönt · kalibreringssvit körd med före/efter-siffror i commit ·
ÖPPNA ÄRENDEN-tabellen i TEXT-AUDIT-PROTOKOLL.md uppdaterad (M1/M15/M16 →
AVGJORT med commit-hash, Del 4-raden kvar tills Fable kört textbytet) ·
BACKLOG-blocket TEXT-AUDITEN uppdaterat.
