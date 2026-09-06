# DESIGN_UPPDRAG — CI:s 54 visuella diffar: döm så CI blir grön utan att låsa in fel

**2026-09-06 · Opus · beställt av Jacob · rad `ci-visuella-baselines-rod`**

## Uppdraget

`app-ci` är röd på 54 visuella diffar (77 pass) sedan de senaste avsiktliga
UI-ändringarna. Inga baselines har skrivits om. Uppdraget: döm varje diff så att
Code kan skriva om baselines för det avsedda och fixa det som är regression — och
CI blir grön på riktigt.

Varför det brådskar (helhetsrapporten §1): permanent röd CI gör att ingen ser nästa
riktiga röda. Inför tolv riktiga spelare måste sviten gå att lita på.

**Grundregel:** en diff accepteras som ny baseline BARA om den pekar på en namngiven
källa (commit eller MASTER-rad) som förklarar exakt den förändringen. "Sannolikt
avsett" räcker inte. Och ingen baseline skrivs om för att bli grön — bara för att
den är rätt.

## Steg 0 — Code/Jacob, före Design

Diffarna finns REDAN som CI-artefakt — regenerera dem INTE lokalt. Baselines är
Linux-only (`*-linux.png`); en Mac-körning av `npm run test:visual` ger `-darwin`-
renders som varken matchar Linux-baselinerna eller versioneras — värdelöst för de 54
CI-diffarna. Rätt källa: `visual-regression`-jobbets artefakt `visual-regression-report`
från de röda app-ci-körningarna (GitHub Actions 34040419661 och 34040569759).

Hämta: `gh run download 34040419661 -n visual-regression-report` (och 34040569759),
eller ladda ner artefakten från körningen i GitHub-UI:t. Artefakten är Playwrights
`test-results/` med `*-expected.png` (Linux-baselinen), `*-actual.png` (nya Linux-
rendern) och `*-diff.png` per fallerad scen.

Organisera per scen till **`docs/visual-review/ci-baselines-2026-09-06/<scen>/`** som
`before.png` (expected), `after.png` (actual), `diff.png`, plus en `index.md` som listar
alla 54 scener (Designs sorteringslista för steg 1). Committa mappen. Design börjar
inte förrän den finns.

## Steg 1 — SORTERA innan du tittar på en enda pixel

Mappa varje diff-scen mot kända avsedda ändringar. Det här är den stora
arbetsbesparingen: de flesta av de 54 är förklarade av fem committar vi känner till.

Kända avsedda källor och vilka scener de bör förklara:

- **design-d2 årtalsformat** (`seasonSpanLabel()`, "2026" → "2026/27", commit `8c4e03b6`
  R1): `board-a`, `board-b`, `board-c`, `season-header`, `season-noplayoffs`,
  `season-fired`, `career-break`, `renew-contract-modal`. **Redan bekräftade** av
  D2-körningen mot `4e4f3542` — dessa åtta är hög A rakt av.
- **design-d1 hero-score i Granska** (`a3044daf5`): Granska-scenerna.
- **design-d7 Bygget → ClubScreen-flik, Akademi → Trupp-toggle** (`35b942ca5`):
  ClubScreen, BottomNav, Trupp, ev. FacilityScreen-relaterade scener.
- **C-T8 kontraktstermer** (`ContractTermChips`, `0f9581a6`): `renew-contract-modal`
  (dubbel källa med d2 — båda avsedda), BidModal-scener.
- **arsbok-dina-val-licensstatus** (`f21a13d8`): årsbokens "Dina val"-scen — licens
  som eget kort.
- **röstintro-introkort** (`3cc76b6e4`): portal-scener med introkort, om sådana
  fixtures finns.

Varje scen du lägger i hög A måste peka på EN av dessa. Kan du inte peka → hög B.

Redan avklarade: `champion` och `journalist-relationship` passerade oförändrade —
ingen åtgärd.

## Steg 2 — Hög A (förklarad): snabb sanity, inte pixel-dom

Per scen, en fråga: visar diffen det källan beskriver, och INGET mer? Ett årtal som
blev "2026/27" — ja. En hero-score-ruta där det förut var en tabellrad — ja.

- Ja → **acceptera** som ny baseline.
- Diffen visar något UTÖVER källans förändring (ett skiftat element, en saknad
  knapp, en färg som inte hör dit) → flytta till hög B. Källan förklarar inte allt.

## Steg 3 — Hög B (oförklarad): här är pixel-domen

Per diff: avsiktlig förbättring ingen skrev upp, eller regression?

Regressionstecken: layoutskift utan skäl, element som försvunnit, färg/kontrast
utanför designsystemets tokens, text som ändrats utan källa, tap-target som
krympt, primärknapp som dubblerats eller tappat hierarki.

- **Regression** → hög C: scen + vad som bröts, till Code. Fixas FÖRE baseline.
- **Oskriven förbättring** → acceptera, MEN skriv upp den som egen MASTER-rad så
  den inte är tyst. En förbättring utan spår är nästa "vem ändrade det här".
- **Oklart** → "behöver Code-läsning": Code spårar vilken commit som rörde scenen.

## Steg 4 — Utdata: en tabell, 54 rader

| scen | källa (commit/rad) eller "oförklarad" | dom: acceptera / regression / Code-läsning | varför (en rad) |

Det är hela leveransen. Jacob kvitterar tabellen, inte pixlarna.

## Steg 5 — baseline-seed, EFTER Design + hög C fixad

Baselines skrivs INTE lokalt (`test:visual:update` på Mac → darwin) och INTE per scen.
De seedas genom workflow `visual-baselines.yml` (workflow_dispatch, med en note om vad
som godkänns) — den regenererar ALLA Linux-baselines till nuvarande render och committar
dem i CI. Allt-eller-inget: körs den medan en hög-C-regression finns kvar bakas
regressionen in som ny sanning. Därför ordning:
1. Design dömer (steg 1–4).
2. Code fixar ALLA hög-C-regressioner först, kör om app-ci tills bara "acceptera"-diffar
   återstår.
3. Trigga `visual-baselines.yml` EN gång → alla 54 (avsedda + nu-rättade) blir ny
   baseline, CI grön på riktigt. Jacob triggar workflowen (Code om gh-access).

## Angränsande, INTE del av detta

Codex flaggade två primärhierarki-frågor (Taktik: två avsiktliga knappar — vilken
är primär?). Det är ett Design-BESLUT, inte en diff-dom — egen rad, ta det separat
när baselines är klara.

## Vem gör vad

Code: steg 0 (hämta artefakten) + steg 5 (trigga baseline-workflowen efter hög C).
Design: steg 1–4 (och det är steg 1 som gör steg 3 kort).
Jacob: kvitterar tabellen, triggar `visual-baselines.yml`. Opus: inget mer här.
