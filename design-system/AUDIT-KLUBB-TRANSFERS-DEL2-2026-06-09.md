# AUDIT — Klubb + Transfers · DEL 2 (skärm-verifierad)

**Datum:** 2026-06-09 · **Par till:** `AUDIT-KLUBB-TRANSFERS-2026-06-09.md` (Del 1)
**Underlag:** screens på Akademi, Orten, Tränare, Transfers (Marknad + Scouting). Code-bekräftat: 2026-05-17-transfers-fixarna landade (b55b7a5 + 113f0af/7c16c7a/658b865) → **inget dubbelrapporteras**.

---

## 0 · Tre fynd över alla skärmar

| # | Sev | Fynd |
|---|-----|------|
| 0.1 | 🟥 | **Masthead visar "4051/52"** på samtliga screens. `seasonSpanLabel`-fixen (rev 06-09) har INTE nått GameHeader-mastheaden. Ska vara "2026/27". Detta är basår-additionsbuggen som skulle vara fixad — verifiera att GameHeader läser `seasonSpanLabel(currentSeason)`, inte rå-beräkning. Träffar varje skärm i spelet, inte bara Klubb. |
| 0.2 | ✅ | **Manager-portrait byggt** (Tränare-fliken, JB-cirkel, leather→copper-gradient, initialer). Pixel-audit-avvikelse 2 stängd. Stämmer mot handoff 05-31. |
| 0.3 | 🟧 | **Två olika tab-barer:** Club = underline-stil (text + copper-understreck), Transfers = pill-stil (copper-fylld aktiv kapsel). Samma app, två tab-bar-språk. Bekräftar Del 1 §1.1 — en delad `<TabBar>` måste välja EN stil. Min rek: pill-stilen (Transfers) är tydligare som segmented control; underline-stilen (Club) försvinner lättare. |

---

## 1 · Akademi-fliken

Ren och läsbar — bäst komponerade Klubb-fliken efter Ekonomi.

| # | Sev | Fynd | Åtgärd |
|---|-----|------|--------|
| 1.1 | 💎 | **Talang-listan** (CA + stjärn-rating, ålder, position) är exemplarisk: tät men luftig, Georgia-namn, copper CA, stjärnor som potential-signal. Bevara. | — |
| 1.2 | 🟨 | **Stjärn-rating (★ / ★★ / ★★★★) saknar legend.** Spelaren ser Bengt Mäkinen CA 13 ★★★★ vs Tobias Dal CA 19 ★★ — stjärnorna = potential, CA = nuläge, men inget förklarar det. Hög CA + få stjärnor = färdig; låg CA + många = råtalang. Stark mekanik, osynlig regel. | Mini-legend en gång överst: "★ = potential · CA = nuläge" eller tooltip. Synlighetsprincipen. |
| 1.3 | 🟨 | **Tre staplade upgrade-kort** (Akademinivå / Anläggning / Mentorskap) har samma visuella vikt men olika natur — Akademinivå+Anläggning är pengar-investeringar, Mentorskap är para-ihop-handling. | Överväg gruppera de två investeringskorten (samma typ av val) och låt Mentorskap stå för sig. |
| 1.4 | 🟨 | **"Anläggning Nivå 58/100"** visas både här OCH i Orten-fliken ("Anläggning & faciliteter" 58). Två platser, samma siffra, olika kontext. Risk för förvirring om var man uppgraderar. | Avgör ägare: anläggning hör hemma i Akademi (utveckling) ELLER Orten (faciliteter), inte båda med upgrade-knapp. Annars dubbel-uppgradering-risk. |

---

## 2 · Orten-fliken — tätast i hela spelet

Åtta sektioner + OrtskartanMap. Detta är den mest informationstäta ytan i Bandy Manager. Den bär mycket bra, men är på gränsen.

| # | Sev | Fynd | Åtgärd |
|---|-----|------|--------|
| 2.1 | 💎 | **OrtskartanMap** — nod-graf med Ortenpuls 54 i mitten, omgivande noder (kassa/kiosk/skola/sponsorer/frivilliga) i copper-ringar. Unik, diegetisk, vacker. Det enda i spelet som visualiserar bygden som ett *nätverk*. Stark identitet. Bevara och vårda. | — |
| 2.2 | 🟧 | **Progress-bar-inflation:** Frivilliga (6 rader), Anläggning & faciliteter (4 rader), Bygdens puls (1), Kommun-relation (1), Klubbrenommé (1) = **13 progress-barer på en skärm.** De börjar smälta ihop till visuellt brus — ögat kan inte rangordna vad som är viktigt. | Differentiera: bara de actionable/föränderliga får full bar; statiska (anläggnings-sub-värden) kan bli kompakta siffror eller en samlad mini-sparkline. Eller gruppera Anläggning till ETT värde + expand. |
| 2.3 | 🟧 | **Fem "Aktivera"-knappar i rad** under Engagemang (Matchvärdar/Bandyskola/Bandyskola avancerad/Pensionärskaffe/Soppkväll/Skolbesök). Samma som community-rader i Ekonomi — men här utan inkomst-siffror. Otydligt vad de kostar/ger jämfört med Ekonomi-flikens version. | Överlapp med EkonomiTab community-aktiviteter? Verifiera att Orten-engagemang och Ekonomi-föreningsaktiviteter inte är två UI för samma system. Om olika: tydliggör skillnaden. Om samma: en plats. |
| 2.4 | 🟨 | **Gold-siffror på Frivilliga** (70/76/48/68/69/87) — gold reserverat för final/mästare/specialanslag per DESIGN-DECISIONS. Här används det som engagemang-poäng. Token-läckage. | Byt till `--success`/`--accent`-skala eller neutral. Spara guldet. |
| 2.5 | 🟨 | **Status-taggar "Neutral"** (Lokaltidningen Helena, Patron Göran, Kommun) — warm-pill. Konsekvent med severity-systemet ✓ men tre "Neutral" i rad säger lite. | OK — men överväg att dölja "Neutral" och bara visa när relationen rör sig (warm/cold). Tystnad = neutralt. |
| 2.6 | 🟨 | **Kommun-raden har tre knappar** (Bjud in / Budget / Bidrag) — mest interaktiva raden, men minst visuell vikt (liten text). | Lyft kommun-interaktionen — det är en av få ställen med faktiska politiska val. |

---

## 3 · Tränare-fliken

Manager-portrait landat. Fliken är ren men har en svag punkt.

| # | Sev | Fynd | Åtgärd |
|---|-----|------|--------|
| 3.1 | ✅ | Portrait (JB), profil-bio, tränaravtal, rivalitet med citat — allt från handoffsen på plats. | — |
| 3.2 | 🟧 | **Belastning-sparklinen är nästan tom** — en svagt lutande grön linje i ett stort kort, label "Frisk" uppe höger. Vid säsong 1 omg 1 finns ~ingen historik → linjen är platt och kortet känns tomt/meningslöst. Samma fallback-problem som PlayerRow-sparkline (handoff 05-31). | Tillämpa samma regel: < MIN_POINTS datapunkter → visa INTE sparkline, visa bara "Frisk · ingen belastning än" som status-rad. Tom graf är värre än ingen graf. |
| 3.3 | 🟨 | **Stort kort, lite innehåll** — Belastning + Tränaravtal är båda enradiga men får full kort-höjd. Tränare-fliken känns gles jämfört med Orten. | Acceptabelt (kontrast mot Orten-tätheten är skön) men överväg att slå ihop Tränaravtal + Belastning till ett "Status"-kort tidigt i karriären. |

---

## 4 · Transfers (Marknad + Scouting) — post-fix

2026-05-17-fixarna syns: tab-bar är nu pill-stil, window-status använder copper/röd utan semafor-emoji, listor är rena.

| # | Sev | Fynd | Åtgärd |
|---|-----|------|--------|
| 4.1 | ✅ | **Window-status "Transfermarknad stängd"** — röd dot + text, ingen 🟢🟡🔴-emoji. 2026-05-17 §1.3 löst. | — |
| 4.2 | ✅ | **Scoutbudget-rad** med copper-dots (10/10) — ren, läsbar. | — |
| 4.3 | 🟧 | **Scouting-listan är 30 rader lång utan gruppering** — alla "Styrka ?" (oscoutade), alla med "Utvärdera"-knapp. 30 identiska rader = väggen 2026-05-17 §densitet förutspådde. Ingen sortering/filtrering synlig. | Gruppera eller filtrera: per position, per "redan utvärderad", eller per region (närmare = billigare scout). Just nu är det en odifferentierad lista. |
| 4.4 | 🟨 | **"Styrka ?" × 30** — varje rad slutar med okänd styrka tills scoutad. Korrekt mekanik, men 30 frågetecken i kolumn signalerar "tomt" snarare än "potential att upptäcka". | Överväg en mer inbjudande oscoutad-state: "Utvärdera för att se" eller en blurrad siffra. Frågetecknet är passivt. |
| 4.5 | 🟨 | **Talangspaning-formuläret** (Position/Max ålder/Max lön + Starta spaning) ligger under 30-rader-listan → måste scrolla förbi allt för att nå det. Det är en *annan handling* än att utvärdera kända. | Flytta upp talangspaning ELLER gör den till egen under-sektion med tydlig avgränsning. 2026-05-17 noterade redan att Scouting-tabben rymmer fyra olika saker. |
| 4.6 | 💎 | **"Starta spaning"-knappen** är copper-fylld (primär) — rätt hierarki, det är fliken-actionen. | — |

---

## 5 · Konsoliderad åtgärdslista (Del 1 + Del 2)

| # | Sev | Åtgärd | Var |
|---|-----|--------|-----|
| 1 | 🟥 | **Masthead-säsong → `seasonSpanLabel`** ("2026/27" ej "4051/52") | GameHeader (global) |
| 2 | 🟧 | **Delad `<TabBar>`** — pill-stil, ersätt Club-underline + Transfers-pill + Squad | Club+Transfers+Squad |
| 3 | 🟧 | **Sparkline-fallback < MIN_POINTS** → status-rad, ej tom graf | Tränare-belastning (+ verifiera Ekonomi) |
| 4 | 🟧 | **Progress-bar-reduktion på Orten** — 13 → differentierade | Orten |
| 5 | 🟧 | **Anläggning dubbel-ägare** (Akademi + Orten) — välj en | Akademi/Orten |
| 6 | 🟧 | **Scouting-lista gruppering/filtrering** + flytta upp talangspaning | Transfers Scouting |
| 7 | 🟨 | **Gold-token-läckage** på Frivilliga-siffror | Orten |
| 8 | 🟨 | **Akademi stjärn-rating-legend** (potential vs CA) | Akademi |
| 9 | 🟨 | **Orten/Ekonomi engagemang-överlapp** — verifiera ej dubbel-UI | Orten+Ekonomi |
| 10 | ❓ | **Bid/Renew-modaler → ledger-vokabulär** (öppen fråga Del 1) | Transfers |

---

## 6 · Domän-dom

**Klubb** är funktionellt rik och till stora delar token-ren (Ekonomi+Akademi+Tränare). Två verkliga problem: **Orten är överlastad** (13 progress-barer + nod-karta + 8 sektioner — den enda ytan som tippar över i brus) och **masthead-säsongsbuggen** (global, 🟥). Resten är finputs.

**Transfers** är post-fix i gott skick — tab-bar, window-status, tokens rena. Återstående: **Scouting-tabbens 30-raderslista** behöver struktur, och tab-bar-stilen bör enas med Club.

**Största enskilda vinsten:** delad `<TabBar>` (löser inkonsekvensen i tre domäner) + masthead-fixen (global). Orten-bantningen är näst störst.

— Design-Claude, 2026-06-09
