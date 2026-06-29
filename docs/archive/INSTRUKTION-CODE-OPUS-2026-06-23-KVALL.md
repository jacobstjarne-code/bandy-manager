# INSTRUKTION TILL CODE/OPUS — live-test 2026-06-23 (kväll)

**Från:** Jacob + Fable/Design · **Underlag:** `KORRVANDA-3B-IMPLEMENTATION-2026-06-23.md` (full fyndtabell + skärmar)

Detta är en byggrunda som gick delvis fel. Flera punkter är **regressioner och spel-logik-buggar**, inte nya designval. Läs full tabell i 3B-dokumentet; detta är marschordern.

## Gör i denna ordning

### 1. 🔴 BLOCKERANDE — cupens vinnar-logik (B1 + B2)
Spelet är ospelbart förbi cupens förstarunda. Vi vann 2–3 men:
- togs till serie-omgång 1 utan cup-avancemang (B1)
- tabellen säger samtidigt "Kvar i cupen" OCH "✕ Utslagen" (B2)

Nästan säkert **samma rot**: cup-matchens vinnare avläses/lagras fel (resultatet 2–3 visas korrekt, men vinnaren tolkas som motståndaren). **Fixa vinnar-beräkningen i cup-flödet → vinnaren ska schemaläggas till kvartsfinal och flaggas "kvar".** Verifiera med ett hemma- OCH ett bortafall.

### 2. 🟠 Portal-overlay låser portalen (B4)
Intro-coachmarkens "Nästa"/sista steg river bubblan men lämnar kvar det transparenta fångst-lagret → hela portalen oklickbar. **Overlayn måste unmounta helt** (lagret + bubblan), inte bara dölja bubblan.

### 3. 🟠 REGRESSION — återställ konsekvens-sektionen (B3)
Beställningen var **att styra upp UTSEENDET** på konsekvens-/"Dina val"-sektionen i matchsammanfattningen. Den blev **borttagen**. Det var aldrig avsikten — mocken (M15) var en omdesign av en *befintlig* sektion. **Återställ sektionen och applicera bara den nya stilen** (utfallsrader, siffra fram, resultat-stripe). Innehållet (kapten, trötta startande, utfall-%) ska tillbaka.

### 4. 🟠 SceneShell — CTA på narrativa scener (B6 + B7)
Match-introts CTA-fix fungerar (bra!) men ärvdes inte av pre-portal-scenerna (Ankomsten, Tre raka, m.fl.). De delar en scen-shell. **Applicera samma regel centralt i SceneShell:** reservera `--bottom-nav-height`, garantera att CTA:n renderas ovanför navet. Då fixas alla scener i ett.

### 5. 🟠 Match-modalen (B5)
Centrera horisontellt (hänger nu höger) + kapa höjden på mobil (spränger skärmen, krockar med nav). Mönster: header kompakt → byteslista scrollar i egen höjd (max ~40dvh) → CTA sticky i botten. Aldrig högre än `100dvh − nav − marginal`.

### 6. 🟠 Konsekvens-kortet — bygg datat bakom (B8)
Portalens KONSEKVENS-kort visar "Ole Carlsson är borta ett tag." + en kedje-ikon — **verkan utan orsak, kedja utan kedja.** **Att ta bort kortet är inte ett alternativ.** Konsekvensen ska finnas och visa sin orsak→verkan-trad ("Förlusten mot X → Ole skadad → borta 3 omg"). **Bygg motorn (RippleTrace, se `2026-06-22_legibel_konsekvens_design.html`)** så kortet får riktigt innehåll. Ytan är designad; datat saknas.

## Referensdesign
- CTA/scroll mot bottennav: `CTA mot bottennav - monsterfix.html`
- Konsekvens-traden: `2026-06-22_legibel_konsekvens_design.html`
- Dina val / inbox: `Inbox + Dina val - tathet och hierarki.html`

## Kvittens — detta funkar, rör inte
CTA i match-intro (korrekt ovanför nav), portal-layout, tabell, cup-trädets layout, Trupp, matchlive-scoreboard.
