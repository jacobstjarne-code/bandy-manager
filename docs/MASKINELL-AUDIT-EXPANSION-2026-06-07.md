# MASKINELL AUDIT — full täckning före mänsklig granskning

**Från:** Opus · **Datum:** 2026-06-07 · **Till:** Code
**Direktiv (Jacob):** allt "tekniskt" och maskinellt ska auditeras *innan* Jacob tittar. Hans tid ska gå till det bara ett öga kan avgöra — inte till sånt grinden eller Code kunde fångat. Det vänder upp Playwright-"taket" jag sköt upp: det är nu prioriterat.

---

## Vad maskinen KAN och INTE kan avgöra (var den mänskliga gränsen går)

- **Token/system-disciplin** (rätt tokens, on-scale-radie, ingen palett-RGB, ingen Tailwind-färg) → **deterministiskt, klart.** `check-design-tokens` + CI. Fångar merparten av "följer systemet".
- **Regression** (ändrades en yta oavsiktligt) → **maskinellt, via Playwright-snapshots** när baseline finns.
- **Mock-fidelity** (ser den renderade ytan ut som Designs mock) → **kräver ett mänskligt ja EN gång per yta** för att sätta baseline. Maskinen kan inte jämföra en render mot en handbyggd HTML-mock. Men efter det ja:et är ytan maskin-vaktad för alltid.

Målet: reducera Jacobs roll till **att godkänna en screenshot en gång per yta** — inte att live-playtesta varje ändring. Code producerar screenshoten; Jacob godkänner från bild, inte från att spela.

## Blockeraren

Dev-galleriet (`/dev/scenes`) renderar inte flera målytor headless (SeasonSummary-header, TRUPP-flik, m.fl.). Därför kan varken Codes `◉ syn` eller Playwright fånga dem — bara live-playtest. Det är den enda anledningen pixel-auditen vilar på Jacobs öga i dag. Lös täckningen och allt annat låser upp.

## Uppgifter (ordning)

**1. Utöka dev-galleriet till full täckning.** Varje yta i det visuella svepet ska renderas *isolerat och headless* i `/dev/scenes`:
- DB-3 hero-score-ytorna (SeasonSummary "Årets match" 40px, RoundSummary 24, GranskaOversikt 36, cup-bracket)
- DB-8 gradient-ytorna (Tabell-header/managed-rad/"Årets match")
- Q2-ytorna, Q4 vardagsrytm (andningsrad + tålamodskort), DB-5/Q1 squad-stripe
- SeasonSummary-headern (52px-titeln), TRUPP-fliken
- Match-laddningens beats (scen/band/kontrast) när de byggs
- MiljöHeader i alla tint-lägen (säsong × väder × klimateArchetype) + fallback-stämpeln
Galleriet ska kunna mata varje yta med fixtur-data så den renderar deterministiskt (ingen Date.now, fast seed).

**2. Code producerar `◉ syn`-screenshots** av varje yta mot mocken och presenterar dem i en samlad bild-bilaga för engångs-godkännande. Inte "awaiting playtest" utspritt — en batch screenshots Jacob/Opus betar av.

**3. Playwright-snapshots, baseline ur godkända lägen.** När en yta är godkänd → snapshot-baseline. Därefter fäller CI varje oavsiktlig pixel-ändring. Det är den uppskjutna "taket"-biten, nu byggd. Lägg till i `app-ci.yml` som eget steg (separat från lint:design).

**4. Spegel-generatorn** (redan grönljus): generera `colors_and_type.css` ur `global.css` så spegeln inte kan ljuga. Stänger desync-hålet (LESSON #39), kompletterar det deterministiska golvet.

## Resultatet

Efter detta är auditen: token/system deterministiskt (grind), regression maskinellt (Playwright), mock-fidelity ett engångs-screenshot-godkännande per yta (människa) i stället för återkommande live-playtest. Jacob tittar bara på det ett öga måste avgöra — och bara en gång per yta.

Det enda som med rätta kräver live-spel även sen: *känsla* över tid (är det kul, svårighetskurva, om en strategi dominerar) — det fresh-eyes-analysen kallar de ärliga blinda fläckarna. Pixel hör inte dit.

— Opus, 2026-06-07
