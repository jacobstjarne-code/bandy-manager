# KORRVÄNDA 3 — match-flödet (fynd 2026-06-23)

**Källa:** Jacobs genomspelning av matchflödet (intro → live/halvtid → presskonferens → cup-helg-modal) + 4 skärmar.
**Av:** Fable / Design · **Status:** dokumentation. Fortsätter KORRVANDA-2-formatet.

Skala: 🟢 ren Code-order · 🔵 design-mock värd en yta · ❔ verifiera först · ✓ ok

---

## M · Match-flödet

| # | Fynd | Kat | Beslut | Ägare |
|---|---|---|---|---|
| M1 | **Match-intro (desktop): CTA ligger oscrollbar bakom bottennavet.** Man når aldrig "Spela"-knappen | 🔵 | **Systemfynd** — samma som M3. Sidan måste reservera utrymme för bottennavet (`padding-bottom`) ELLER CTA:n flyta ovanför navet. CTA får aldrig hamna bakom fast nav. | Design→Code |
| M2 | **Blå fyrkant/fokusring kring "Match" i bottennavet** | 🟢 | Webbläsarens default `:focus` outline läcker fram. Ersätt med appens egen fokusstil (eller `:focus-visible` only) — aldrig blå systemruta. | Code |
| M3 | **Halvtidsmodal (live · Byten): CTA under navet, listan inte scrollbar hela vägen.** "Spela klart"-raden täcker primärknappen, byteslistan går bakom | 🔵 | Samma rot som M1. Modalens innehåll ska scrolla i sin egen höjd, CTA-raden sticky ovanför bottennavet, knappen aldrig dold. | Design→Code |
| M4 | **Presskonferensen — kontroll:** vänsterkant + knapp-utseende | ✓ | **Ser rätt ut.** Vänster accent-bar konsekvent över PRESSKONFERENS/MEDIA/DINA VAL. Svarsknappar enhetliga (outline + moral-delta dämpad). Liten notering: "Vägra"-raden har emoji + längre konsekvens — medvetet avvikande för negativa valet, ok. | — |
| M5 | **"Helgen"-modalen ska heta "Cuphelgen".** Ändringen begärdes i förra korrvändan men **är inte gjord** — genre-etiketten står fortfarande "⬩ HELGEN ⬩" | 🟢 | Byt genre-label "HELGEN" → "CUPHELGEN" i pre-portal-scenen (cup-finalhelg-varianten). Ren copy-fix som tappades. | Code |
| M6 | **Cupfinal-modalen: tautologi.** Genre-rubrik "⬩ CUPFINALEN ⬩" + textrubrik "Cupfinal." direkt under — säger samma sak två gånger | 🟢 | **Håller med Jacob — ta bort textrubriken.** Behåll genre-etiketten, låt brödtexten börja direkt på "Två lag kvar…". Gäller troligen fler scen-varianter med samma dubblering. | Code |
| M7 | **Straffarna visas inte i händelsetidslinjen / matchlive** — bara i slutresultatet ("Straffar 4–3") | 🔵 | **Min rek: ja, visa dem — på båda ställena.** Straffläggningen simuleras redan (matchCore), den *avgör* matchen, och att dölja klimaxet bryter "allt som händer syns"-principen. Visa varje straff som händelse (skytt/miss) i tidslinjen + live-flödet. Särfall ja, men det mest dramatiska — förtjänar yta. | Design→Code |
| M8 | **Konverteringssiffran på Shotmap är inkonsekvent — TVÅ formler för "konvertering" på samma kort.** "Den här matchen" = `mål / på mål` (5/6 = 83%); "Hittills" = `mål / totala skott` (47%); Analys-fliken = `mål / totala skott` också | 🟢 | **Roten är INTE straffarna** (de räknas konsekvent som skott+på mål, P2). Roten: `GranskaShotmap.tsx:211` använder `scoredCount/onTargetCount`, rad 229 + `GranskaAnalys:144` använder `goals/shots`. **Renodla till EN definition** — rek: `mål / totala skott` överallt (matchar Hittills + Analys), så 83% blir ~21% och slutar se tokigt ut. Alternativt: behåll båda men döp om dem ("träffsäkerhet" vs "målkonvertering") så de inte heter samma. | Code |
| M9 | **Straff i statistiken (renodling):** straffar räknas som skott+på mål — bekräfta att det är önskat | ❔ | Per P2 är det medvetet och konsekvent. Inget fel i sig, men om M7 byggs (straffar som egna händelser) — säkerställ att de inte dubbelräknas i skottstatistiken. Bekräfta med Opus. | ❔ Opus |
| M-straff | **Matchsammanfattning efter straffar** (5–5, Straffar 4–3, "Seger (straffar)") | ✓ | **Ser rätt ut.** Särfall som bara finns i cup/final — korrekt särbehandlat. | — |
| M10 | **Cupvinst-skärmen (Cupmästare 2026): bottennavet är borta.** App-headern (klubb · Omg · ?) ligger kvar men navet saknas — inkonsekvent chrome | 🔵 | **Håller med Jacob — navet bör ligga kvar.** Antingen behåll båda chrome-delarna (header + nav) ELLER gör det till en äkta full-bleed ceremoni utan någon chrome. Halvvägs (header men inget nav) känns som en bugg, inte en ceremoni. Rek: behåll navet eftersom headern finns. | Design→Code |
| M11 | **Modal efter cupvinst ("Vi vann cupen"): backdrop-opaciteten är för låg — bakgrunden läcker igenom.** Inte samma som tidigare scen-modal (Cuphelgen var ordentligt mörk/täckande) | 🟢 | Standardisera modal-backdropen till samma värde som de övriga scen-modalerna. En delad token/overlay-stil — inte per-modal opacitet. Pre-portal-scenerna ska ha identisk dämpning av bakgrunden. | Code |
| M12 | **Inboxen blir busy och "jämntjock" snabbt** — 20 notiser, alla rader nästan lika tunga, repeterade typer (två "Birgitta Nordin på besök", flera "Nemesis", flera Allehanda-rubriker) | 🔵 | **Behöver hierarki + komprimering.** Rek: (a) "Kräver svar" som kort, "Nyheter" som tunna en-rads-poster; (b) dämpa redan lästa; (c) gruppera/slå ihop repeterade typer ("3 nemesis-uppdateringar", "2 mediaröster") så listan andas. Samma anti-brus-princip som callback/portal-beats. Mock-värt. | Design→Code |
| M2-bekräftat | **Blå fokusruta i navet — systemiskt.** Syns nu på Trupp OCH Tabell OCH Match, inte bara en flik | 🟢 | Bekräftar M2 som systemfix, inte engångsfel. En `:focus-visible`-regel för hela bottennavet löser alla på en gång. | Code |
| M13 | **Trupp ser nu mycket bättre ut** (efter Säsongsbåge-omarbetningen) | ✓ | Bekräftat — lägesratt + reaktioner läsbara. Kvarstår bara M2-fokusrutan. | — |
| M14 | **Portal inför omgång 1 · Tabell · Cupen — kontroll** | ✓ | **Ser bra ut, alla tre.** Portal ren och läsbar, tabellen tydlig (form-prickar + legend), cup-trädet snyggt (rundor, skyttekungar, ★-markering av egna laget). Inget att åtgärda utöver M2. | — |
| M15 | **"Dina val" (Granska) blir ett textblock** — innehållet är egentligen väldigt actionable (kapten, vilka som startade trötta + utfall %) men renderas som UPPERCASE-etikett + kursiv mening, staplat → läses som vägg | 🔵 | **Strukturera som utfallsrader/kort:** varje val = beslut + tydligt resultat (bra/neutralt/dåligt-indikator) + siffran (0% / 21% / 9%) framträdande. Scanbart, inte prosa. Mock-värt. | Design→Code |

---

## Systemfynd (viktigast)
**CTA bakom bottennav är inte ett engångsfel — det återkommer i M1 (match-intro) OCH M3 (halvtidsmodal).** Det pekar på ett strukturellt mönster: fasta CTA:er/scrollytor tar inte höjd för det fasta bottennavet på desktop. **Rekommendation:** en delad regel — varje scrollyta reserverar `--bottom-nav-height` (+ safe-area), och flytande CTA:er ligger `bottom: var(--bottom-nav-height)` aldrig under. Fixa mönstret, inte bara de två instanserna.

## Rena Code-ordrar
- M2 fokusring i nav · M5 "Helgen" → "Cuphelgen".

## Mock-värt
- M1+M3 CTA/scroll mot bottennav (ett mönster, en mock räcker för båda).

## Godkänt
- M4 presskonferensen (vänsterkant + knappar ok).
