# CODE-INSTRUKTION — IMPLEMENTATIONSAUDIT DEL 2, FULL OMFATTNING

**Datum:** 2026-08-09 · **Av:** Opus (chat)
**Underlag:** `docs/incoming/Implementationsaudit-del2-2026-08-09.dc.html`, `docs/incoming/github-synk-2026-08-09.md`
**Beslut (Jacob):** hela auditen byggs, även fördjupandena. Vi släpper när produkten är bra, inte när den är felfri.

**Ordningen är inte förhandlingsbar:** fabriken → baseline per yta → ombyggnad. Varje yta får sina tillstånds-snapshots *före* den byggs om. Det är enda skälet något här står efter något annat.

**Verifierat av mig i produktionsbygget innan ordern skrevs:** CSS:en definierar `card-stagger-1` t.o.m. `-6`, bundeln emitterar `-7`. Strängen `Nemesis:` ligger i bundeln, alltså är grupperingen titelberoende. Auditen har rätt på båda.

**Anmärkning till Design:** synkfilen säger att livesajten inte gick att nå. Den går att nå — `bandy-manager.vercel.app`, öppen utan inloggning. Tre av auditens påståenden har varit inaktuella mot produktion i två omgångar nu. Verifiera mot körande app, inte bara mot källkod.

---

## Etapp A — fel, byggs först

Saker där appen påstår något som inte är sant. Ingen av dem behöver baseline.

**A1 · `card-stagger-7`** i `global.css` (280 ms / 360 ms, samma kurva som 1–6). Alternativt kapa emitteringen till 6 — välj det som ger minst diff och rapportera vilket.

**A2 · Inbox, strängberoendet.** `title.startsWith('⚠️ Nemesis:')` → ett `kind`-fält på `InboxItem`. Regex-parsningen av outlet ur `body` → strukturerat `item.outlet`. Markören blir Lucide, inte emoji i copy — `⚠️` ligger utanför den bundna emoji-kartan och bryter emoji=chrome. Ingen layoutändring; severity- och roll-up-arkitekturen är orörd.

**A3 · SeasonSummary, dubbelkällan.** DIN SÄSONG och SÄSONGENS BERÄTTELSER dedupar var för sig men läser samma `game.storylines`. Slå ihop till en tidslinje med delad `seenTypes`. **Rapportera först** om de faktiskt kan dubblera i dag eller om något filtrerar tidigare — auditen kan ha läst en gren som inte nås.

**A4 · Spillmarkering, båda ytorna i samma commit.** `slice(0, 10)` i Marknad-grupperna och chips-kapningen i Trupp är samma bugg: innehåll döljs utan att det syns att det finns mer. Samma `+N`-mönster på båda. (Trupp-delen låg redan i `CODE_INSTRUKTION_VISUELL_AUDIT_YTA2_YTA3` — bygg dem tillsammans, inte i två rundor.)

---

## Etapp B — komposition, efter respektive baseline

**B1 · Inkommande bud, två steg.**

Först: routa budet till Inbox som `KRÄVER SVAR`-item med `expiresRound` som deadline. Ytan finns, severity-språket finns, och det gör händelsen synlig på den skärm som läses varje omgång.

Sedan: `IncomingBidCard` överst på Marknad enligt auditens efter-bild — vem, deadline, motiv (`dreamClubId` / `loyaltyScore`), två vägval. 🔥-badgen på Sälj degraderas till sekundär referens men behålls.

Båda byggs. Inbox-routningen först eftersom den är billig och står på egna ben; kortet efter Transfers-baselinen. **Wiringen till nemesis / öppna trådar ingår inte** — se etapp C.

**B2 · SeasonSummary, kapitelindelning.** Fyra kapitel-dividers (Georgia + `--accent`-linje) mellan befintliga sektionsgrupper: Resultat → Berättelsen → Truppen → Siffrorna. Ingen ny komponent, ingen omflyttning av innehåll.

**B3 · `SeasonBits` med density-prop.** Extrahera Headline / Timeline / Awards / EconomyDelta; `SeasonSummary` = `full`, `History` = `mini`. Det här är den enda posten i auditen som är arkitektur och inte yta — den byggs sist i etappen och rapporteras innan den påbörjas: vilka sektioner som faktiskt är gemensamma och vilka som bara ser lika ut.

---

## Etapp C — ligger kvar, och varför

**Nemesis-wiringen** (säljbeslut → `OpenThread(nemesis)`). Inte för att den är oviktig utan för att den inför tillstånd som sparfilerna ska bära över säsonger, alltså migration, och effekten kan inte observeras inom en testomgång. Den byggs när äventyrsspåret wiras som helhet — inte som en bihang till ett budkort.

---

## Baselines som krävs

Utöver de fyra portal-tillstånden och Trupp/Tabell/Uppställning:

- **SeasonSummary**, tre utfall: mästare (guld-hero + cup), mittenlag (inget slutspel), sparkad (game over-grenen). Fångar att kapitelindelningen håller när sektioner saknas.
- **Samma snapshot mot History i mini-läge** — beviset att den delade byggsatsen renderar båda tätheterna.
- **Transfers**, fyra fönstertillstånd: stängt, öppet utan bud, ett inkommande bud, flera bud. Fångar att budkortet inte försvinner när fönstret växlar.

Alla via fabriken. Behöver något av tillstånden en override som inte finns — `withIncomingBid`, `withSeasonOutcome` — bygg den som en override, inte som en egen scen.

---

## Ordning

Fabriken → A1–A4 → Trupp/Tabell-baseline → Trupp + Tabell → portal-baseline → portal-takregeln → SeasonSummary-baseline → B2 → Transfers-baseline → B1 → B3.

## Text

Ingen ny svensk copy i något av detta. Behöver en yta en rad som inte finns: märk `[Opus]` och lämna listan till mig.
