# REVIEW — Spelkänsle-genomgång II ur systemlins

**Av:** Opus · **Till:** Fable/Design · **Datum:** 2026-06-17
**Underlag:** `Spelkansle-genomgang II Bandy Manager.html` (A spelarkort · B taktik · C/D naven)

---

## Kort

Disciplinen är rätt: allt på befintliga tokens och komponenter, ingenting göms (Jacobs styrning helt absorberad), lärdom #9 åberopad i A. Det en systemläsning lägger till är en **byggbarhets-triage** — mocken visar hur ytan ska kännas, men inte vilket system som finns bakom varje "levande" element. Tre av fyra ytor är byggbara nära; en handfull showpieces ska bekräftas mot data först.

## A · Spelarkortet — riktning rätt, porträttet är wiring (inte blockerat)

Att leda med människan och gruppera de fjorton sektionerna i tre etiketterade lägen (inget gömt, allt nåbart) är rätt instinkt och billig: rösten finns redan, den lyfts bara från sektion elva till toppen.

Porträttet är **byggbart nu**: illustrerade porträtt finns redan — `public/assets/portraits/portrait_{young,mid,exp,vet}_1..8.png` (32 st, fyra ålders/karriär-tiers i illustrationsstilen), illustrationssystemet (`IllustrationScene`, mock 2026-06-05) och specen. Hjälteporträttet är alltså en mappning: spelarens ålder/karriärstadie → tier → seedat val inom tiern, som ersätter den procedurella SVG:n. Ingen ny pipeline.
- **Cleanup:** `portraitService.ts` bär en stale `@deprecated`-kommentar ("PNG assets don't exist") som nu är felaktig — assets finns i `public/assets/portraits`. Stubben ska bort/uppdateras och PlayerCard wiras mot arketyp-setet.
- **Bekräfta:** säsongsbåge-raden. Den ska genereras ur loggen (formkurva, kapten-sedan-omg, resultat), inte författas. Exempelradens "laget följer honom" hävdar en lag-effekt motorn kanske inte modellerar — verifiera per klausul (lärdom #9), annars trimma raden till det loggen faktiskt bär.

## B · Taktiken — den starkaste arkitektur-vinsten

Att taktik bor på tre ställen utan sanningskälla är en äkta state-duplikation (vilken vinner om de säger emot?). Att kollapsa till ett spelstil-segment som delas med matchförberedelsen är en systemfix, inte bara visuell — och rätt.
- **Bekräfta:** att det blir **en kanonisk taktik-state** som alla tre ytor (denna, Taktiktavlan, matchförberedelsen) läser och skriver — inte tre stores med samma etikett.
- Kemi-overlay + "så spelar det"-raden är de data-beroende delarna. Overlay:n kräver att kemimodellen avger par-/positionsvärden att rita kanter ur; "så spelar det" måste härledas ur faktisk taktik + trupp (formationsglapp, kemihål), inte vara canned. Är de databackade är "så spelar det" det mest levande tillägget i hela dokumentet — det gör taktiken läsbar i stället för bara uppställd.

## C/D · Naven — grönt, redo för Code

Lägsta risk, bredast verkan i dokumentet. En delad TabBar → radbrytning till två rader + den **redan befintliga** dot-proppen löser Klubb, Övergångar och varje framtida sektion i **en** komponentfix. Inget nytt API.
- En gräns värd att skriva ut: tvåradig wrap skalar till ~7 piller; bortom det blir det tre rader och navet slutar vara scanbart. Då är frågan inte wrap utan om sektionen har för många mål. För 6 (Klubb) och 5 (Övergångar) är fixen rätt nu.

## Triage / routing

- **C/D → Code nu.** Ren komponentfix, två skärmar plus framtida på en gång.
- **A → Code nu:** omgruppering till tre lägen + lyft rösten/känsloläget till toppen + wira porträttet mot arketyp-setet + städa stale `portraitService`-stub. Säsongsbågen: bekräfta loggen innan den raden skrivs.
- **B → Code nu:** avstapling till en pillrad + en kanonisk taktik-state (bekräfta store först). Kemi-overlay + "så spelar det": bekräfta kemimodell/generator innan de byggs.
- Ingen megaprojekt-risk i dokumentet. Allt vilar på befintliga tokens, komponenter och assets.

— Opus, 2026-06-17
