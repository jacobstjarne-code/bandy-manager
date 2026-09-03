# Bandy Manager — Designunderlag för överlämning

Sex fristående HTML-filer (öppnas offline i webbläsare). Canvas-vyer panoreras med mus/trackpad; prototyperna är klickbara.

## Innehåll

1. **Typografi-kanon** — sign-off-underlag för typkonsolidering. Beslutat: label = 9px praxis, emoji ut ur rollen. Ny `.h-num`-skala (12/15/18). Färg stannar inline.
2. **Live-vy före/efter** — matchvyn blir yteffektiv (flöde 196→528px). Tavlan komprimeras mellan moment, siffror i utfällbar låda, händelse-CTA skild från avancera-CTA.
3. **Intro & Guide** — Tillträdet (diegetisk första-vecka, ersätter CoachMarks-touren) + Klubbpärmen (in-world manual, ersätter HelpOverlay). Med flödeskarta.
4. **Audit-syntes — 7 ytor** — kärnleveransen. Motorn är byggd; jobbet är att yta och koppla. Ytorna: ripple "därför hände det", veckans beslut + grindad CTA, Analys→Taktik-brygga, taktik-bräde, manager-arc, gemensam besluts-modell, plan.
5. **Prototyp · Beslut→följd** — *klickbar*. Bevisar slingan beslut → grind → orsakskedja (olika följd per val). Ytar `weeklyDecisionService` + `rippleEffectService.describeRippleChain`.
6. **Prototyp · Analys→Taktik** — *klickbar*. Bevisar bryggan eftermatch → nästa taktik (justering förvald, animerad). Kopplar `GranskaAnalys` → `TaktikScreen`.

## Rekommenderad ordning (från auditen)

0. Kör `debug/designAudit`-harnesset (fångar hårda inkonsistenser).
1. Ripple + weeklyDecision som **en** slinga (fil 4 yta 1+2, fil 5).
2. Granska-Analys → Taktik (fil 4 yta 3, fil 6).
3. Manager-arc-yta + gemensam besluts-modell (fil 4 yta 4 + 5b).
4. Städpass: advance() ut ur Granska-skärmens livscykel (latent bugg).

## Design / Code

- **Design klart** för alla ytor ovan (sign-off mot dessa filer).
- **Code-pass** (ej designfrågor): roundProcessor-orkestreringen (körordning), advance()-sidoeffekten, den gemensamma besluts-modellens implementation, samt verifiera ev. dubblerade ripple-utdrag i roundProcessor + usage på hint-klustret.
