# OKULÄR AUDIT — PROTOKOLL

**Syfte:** efter en sprint med många ändringar tar Opus ett okulärt förstapass i
levande app — verifierar att allt renderas, ligger rätt och inget är
trasigt/överlappat/avklippt/dött — så Jacob får en ren app och kan playtesta
*känslan* istället för att jaga renderingsfel. Efter en sprint fokuserar Jacob
lätt bara på felen och hinner aldrig känna spelet; det okulära passet röjer undan
felen först.

## Roller

- **Opus (chatten):** okulär audit i Claude in Chrome mot preview-URL. Browser-
  agenten (navigate/computer/resize_window/gif_creator) är ansluten i CHATTEN,
  oavsett modell. Okulär audit + svensk copy + diagnos hör till Opus-rollen.
- **Code (VS Code, Sonnet 5):** pushar preview-deploy (Vercel-MCP), rapporterar
  URL + build-hash till chatten. Bygger fixar ur audit-fynden.
- **Jacob:** känsla-pass ovanpå en ren app. Subjektivt tempo/timing/"förstår jag
  vad som hände" är hans, alltid.

> Modellnot: browser-agenten funkar även om chatten bemannas av Sonnet, så ett rent
> audit-pass KAN köras billigare med Sonnet i chatten. Men blanda inte in copy-
> uppgifter i ett sådant pass — svensk text är Opus-rollens, aldrig Sonnets.

## Vad Opus auditerar (okulärt, inte känsla)

- Renderas allt som ska? Inga tomma ytor där data väntas, ingen krasch-placeholder.
- Ligger det rätt? Överlapp, dubbel-header, avklippt text, kort med olika
  margin/padding, element utanför 430-kolumnen.
- Rätt sak på rätt plats? Ikoner, färger mot tokens, z-ordning (docken över feed,
  tavlan över scrim, modaler över tavlan).
- Responsivt: `resize_window` till 430 (standard) + 375×667 (små-skärms-fynd,
  t.ex. peek-höjd).
- Flöden som syns direkt utan speciell speldata: dock-inglidning, FF-paus på straff,
  CTA bakom nav, scrim-dimning. GIF via `gif_creator` när ett rörelseförlopp är poängen.

## Vad Opus INTE gör

- Dömer inte tempo/timing-känsla (220ms hackigt? 5s nog?) — Jacobs.
- Framkallar inte djupa speltillstånd som kräver många omgångars klick (t.ex.
  cup-avancemang) om det inte är rimligt nåbart — flaggar istället "kräver Jacobs
  playtest, ej okulärt nåbart".

## Standardrutt (justeras per sprint)

Portal → Trupp → Match (live, kör en bit) → Granska → Klubb-flikarna → Transfers.
Vid en dock/match-sprint: fokusera MatchLive + Design-auditens fyra punkter
(block-interaktion, peek, 375×667, timer).

## Leverans

Fynd-lista: per fynd VAD + VAR (skärm/route) + skärmdump + allvarsgrad + VEM fixar.
Regel 6 gäller — varje fynd slutar i vem som gör vad.

## Trigger

Efter en sprint med ≥2 synliga/UI-ändringar, eller när Jacob säger "auditera".
Alltid mot preview-deploy, inte localhost (browser-agenten når preview säkert;
localhost är osäkert tills testat).
