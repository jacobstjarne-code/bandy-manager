# CODE-UPPDRAG — B1 Navigering: Bygget egen flik, Transfers kontextuell

**Datum:** 2026-06-19
**Från:** Opus (efter Jacobs ratificering av Fables navsvar)
**Källa:** `design-system/briefs/SVAR-B1-NAVIGERING-FABLE-2026-06-19.html` (Fables svar) + `DESIGN-BRIEF-B1-NAVIGERING-OCH-LIV-2026-06-19.md` (briefen)
**Status:** RATIFICERAT av Jacob 2026-06-19. Navomflyttningen är Code-redo. Detta uppdrag täcker BARA navigationen — Valet-scenen, portal-beatet och prövningens processteg är INTE med (de väntar på Opus-arbete, se §SENARE).

---

## Beslutet (ratificerat)
Bygget får en egen permanent flik i bottennavet. Transfers lämnar den permanenta raden och blir kontextuell. Navet förblir sex mål:

```
FÖRE:  Hem · Trupp · Match · Tabell · Transfers · Klubb
EFTER: Hem · Trupp · Match · Tabell · Bygget · Klubb
```

Transfers delas på tidskänsla:
- **Kontrakt/förlängningar** (åretrunt-truppvård) → flyttar in i Trupp som fjärde subflik "Värvning".
- **Marknad/scouting/fria/sälj** (säsongsbundet) → nås via Värvning-subfliken, OCH eleveras till egen nav-flik bara när transferfönstret är öppet.

---

## Vad koden redan har (verifierat 2026-06-19, läs själv innan du rör)
Detta gör uppdraget mindre än det låter — strukturerna finns:

1. **`BottomNav.tsx`** — `tabs`-arrayen är 6 hårdkodade objekt. Window-status finns redan: `getTransferWindowStatus(currentDate)` + `transferWindowOpen`-villkoret ritar redan en prick på Transfers-fliken. Den logiken ÅTERANVÄNDS för den villkorade Transfers-fliken.
2. **`SquadScreen.tsx`** — har REDAN en intern `TabBar` med `screenTab: 'nu' | 'trupp' | 'taktik'`. "Värvning" blir en fjärde flik i den befintliga strukturen, inte ett nytt mönster.
3. **`TransfersScreen.tsx`** — har REDAN en `TabBar` med fem sub-tabs: `marknad / scouting / contracts / freeagents / sell`. `contracts` ÄR åretrunt-delen som ska till Trupp; de andra fyra är säsongsdelen. Tabben tar redan `location.state.tab` för djup-länkning (används av PlayerCard "Förläng").
4. **`AppRouter.tsx`** — routes under `/game`. `facility` (= trädet, `FacilityScreen`) finns redan. `transfers` och `squad` är egna routes.
5. **`FacilityScreen`** — trädet, redan byggt och renderar.

---

## ÄRLIG KOMPLEXITETSFLAGGA (läs innan du börjar)
`contracts`-tabben i TransfersScreen är INTE en ren urklippning. Den delar `handleRenew`, `RenewContractModal`, `expiringPlayers`-beräkningen och wage-overrun-logiken (`WageOverrunWarning`, `pendingAction`) med resten av filen. Att flytta den till Trupp innebär antingen (a) lyfta `handleRenew` + modal + wage-logik till en delad komponent som båda ytorna importerar, eller (b) en `ContractsTab`-komponent som äger sin egen renew-logik och importeras av både SquadScreen (Värvning) och som fallback i TransfersScreen. **Välj (a) — extrahera `ContractsTab` som äger renew-flödet, importera i SquadScreen.** Skälet: undvik två sanningar för kontraktsförlängning. Flagga om extraktionen visar sig dra in mer delat state än väntat — stanna och rapportera innan du bygger vidare.

---

## FAS 1 — Bygget-fliken in, navet flyttat om
**Mål:** Bygget ersätter Transfers permanenta plats. Trädet nås från fliken.

1. **Route:** Lägg `<Route path="bygget" element={<FacilityScreen />} />` i `AppRouter.tsx` under `/game`. Behåll `facility`-routen tills vidare (deep-links kan peka dit) — men `bygget` blir den kanoniska. Om `FacilityScreen` antar att den öppnas som push-med-tillbaka (per REVIEW-B1 N3) måste den nu fungera som flik-destination utan tillbaka-pil — verifiera och justera.
2. **`BottomNav.tsx` `tabs`-array:** ersätt `{ to: '/game/transfers', label: 'Transfers', Icon: ArrowLeftRight }` med `{ to: '/game/bygget', label: 'Bygget', Icon: <välj ur lucide — förslag: Hammer eller Wrench, men se ICON-BRIEF.md först> }`. Transfers-objektet tas BORT ur den permanenta arrayen (det blir villkorat, se Fas 3).
3. **Badge-mappning:** `expiringContracts`-badgen satt på `/game/transfers` — den flyttar med kontrakt till Trupp (Fas 2). Ta bort `'/game/transfers'`-raden ur `badges`-objektet i denna fas; återinför ev. på Värvning-indikator i Fas 2.

**Gate:** `build` (tsc) ren · `npm test` grön · `lint:design` grep-rent. Navet visar Bygget, klick → trädet renderar som flik.

---

## FAS 2 — Kontrakt flyttar in i Trupp som "Värvning"
**Mål:** "Värvning"-subflik i Trupp; kontraktsförlängning bor där.

1. **Extrahera `ContractsTab`** ur TransfersScreen (per komplexitetsflaggan ovan): komponenten äger `expiringPlayers`, `handleRenew`, `RenewContractModal`, wage-overrun-flödet. Props: `game` + nödvändiga store-actions.
2. **SquadScreen:** lägg `'värvning'` som fjärde id i `screenTab`-TabBar (`'nu' | 'trupp' | 'taktik' | 'värvning'`). Rendera `<ContractsTab>` när `screenTab === 'värvning'`.
3. **TransfersScreen:** `contracts`-tabben i TransfersScreens egen TabBar tas bort därifrån (den bor nu i Trupp). De fyra säsongstabbarna (marknad/scouting/freeagents/sell) blir kvar.
4. **PlayerCard deep-link:** `onExtendContract` navigerar idag till `/game/transfers` med `state.tab='contracts'`. Ändra till `/game/squad` med `state` som öppnar Värvning-subfliken + renew-modal. SquadScreens `location.state`-effekt måste hantera den nya inkommande staten (mönstret finns redan för `highlightPlayer`).

**Gate:** samma tre gates. Förläng kontrakt via Trupp→Värvning fungerar; PlayerCard "Förläng" landar rätt; inga döda referenser till `contracts`-tab i Transfers.

---

## FAS 3 — Transfers som villkorad nav-flik vid fönster
**Mål:** Marknaden (säsongsdelen) eleveras till nav-flik bara när fönstret är öppet.

1. **`BottomNav.tsx`:** efter den permanenta 6-arrayen, injicera Transfers-fliken VILLKORAT när `transferWindowOpen` (samma `getTransferWindowStatus`-villkor som redan finns). Design säger "Värvning" som etikett när den är elevad — men verifiera mot ICON-BRIEF/etikettkonvention; den bär samma window-prick som redan är byggd. När fönstret är stängt: ingen Transfers-flik i navet.
   - **Trångheten:** elevation ger TILLFÄLLIGT 7 mål under fönstret. Det är ett medvetet undantag (Design: "tillfälligt sjunde mål under fönstret är ett medvetet undantag, inte normalläget"). Acceptera det — bygg INTE en utträngningslogik som tar bort en annan flik.
2. **Ingång inifrån Trupp:** när fönstret är stängt nås marknaden ändå. Värvning-subfliken i Trupp ska ha en ingång till de fyra säsongstabbarna (marknad/scouting/fria/sälj) — antingen inline eller via navigation till `/game/transfers`-routen (som blir kvar, bara inte permanent i navet). Enklaste vägen: behåll `/game/transfers`-routen, låt Värvning-subfliken länka dit för marknad. Verifiera att routen fungerar utan nav-flik.

**Gate:** samma tre. Fönster öppet → Transfers-flik syns i nav m. prick; stängt → borta men nåbar via Trupp→Värvning. Window-pricken beter sig som förr.

---

## VAD DETTA INTE ÄR (lämna orört)
- **Orten-rensningen** (flytta anläggnings-sektionen ut, deep-link arena-noden → Bygget): Fable specade den men den korsar OrtenTab-innehåll. EGEN runda efter att navet sitter — inte denna order. (Flaggas i BACKLOG.)
- **Valet som säsongsstart-scen:** väntar Opus (scentext + scen-wiring mot `getPreSeasonChoices`). INTE Code nu.
- **Portal-beatet:** väntar Opus (svensk ton-pool + state-change-detektion). INTE Code nu.
- **Prövningens processteg:** väntar Opus mekanik-låsning (per REVIEW-B1 §6 / 06-11 §5). INTE Code nu.
- **Emoji→Lucide i nav-ikoner:** TODO(FAS 1)-raderna i BottomNav hör till det separata emoji→Lucide-svepet. Rör bara Bygget-ikonen i denna order; lämna de andra TODO:erna.

---

## Ordning & rapport
Bygg Fas 1 → gate → Fas 2 → gate → Fas 3 → gate. Rapportera per fas. Om komplexitetsflaggan (ContractsTab-extraktionen) drar in mer delat state än väntat: stanna efter Fas 1, rapportera, invänta besked. Avsluta med commit-range + bekräftelse att alla tre gates är gröna.
