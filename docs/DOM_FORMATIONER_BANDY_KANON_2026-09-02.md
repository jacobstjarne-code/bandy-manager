# DOM — FORMATIONER ÄR BANDY-KORREKTA + bandykunskaps-kanonen saknas

**Datum:** 2026-09-02 · **Av:** Opus + Jacob · **Utlöst av:** `c-fm1-formationer-fotboll` / `sluttest-b1-formationssystem` — såg ut som en öppen "bygg om till bandyäkta formationer"-fråga. Kanonläsning (Jacob mindes rätt): den är redan utredd.

## Beslut 1 — `c-fm1-formationer-fotboll` STÄNGS (stale, felnamnd)

`TEXT_REVIEW_formations_2026-04-20.md` (GODKÄND av Jacob 2026-04-20) visar att formationerna ÄR bandy-korrekta: de sex (5-3-2, 3-3-4, 4-3-3, 3-4-3, 2-3-2-3, 4-2-4) är byggda på bandy-anatomi — **libero, halvor (halvbackar), forwards, ytterforwards, halvlinje**, inte fotboll. Coach-citaten är bandy-idiomatiska ("Äger du mitten i bandy äger du matchen").

Det som VAR fotbollsproblemet är redan LÖST: de gamla taggarna påstod match-EFFEKTER (`+OFFENSIV`, `+HÖRNOR`) som formationen inte ger (mentality/tempo/press/cornerStrategy styr dem separat — formation påverkar INTE matchmotorn, bara slots/kemi/position-matchning). Domen 2026-04-20 rättade taggarna till att reflektera ANATOMI (`4 FORWARDS`, `KRÄVER LIBERO`), inte effekter. Så "formationer-fotboll" var en TAGG-fråga (löst), inte en struktur-fråga. **Radnamnet ljuger — stäng den mot 2026-04-20-domen.**

Jacob bekräftade från minnet: offside FINNS i spelet, formationerna var rätt. Ingen öppen formations-/regel-fråga.

## Beslut 2 — DEN VERKLIGA LUCKAN: bandykunskaps-kanonen är utspridd, inte samlad

**PRIORITET HÖJD 2026-09-03 (Jacobs oro):** "en massa kunskap som du glömt tidigare." Detta är inte längre ett trevligt framtida pass — det är FIXEN på att bandykunskap bor i kontext och i huvuden i stället för på disk. Bevis samma dag: Opus blandade ihop `bandyplay` (STREAMINGTJÄNSTEN för Elitserien, StayLive) med "bandyskola för barn" (ungdomsverksamhet) — två HELT olika saker, sammanblandade i både kod-etikett och Opus text. Opus "visste" inte skillnaden för att den inte finns på disk. Formationerna var samma mönster (trodde de kunde vara fel för att rättheten låg utspridd i sex filer).

**BANDYPLAY-FÖRVIRRINGEN (MASTER-rad, egen fix):** `bandyplay`-fältet i `communityActivities` (EkonomiTab "Bandyskola för barn", ikon ⛸️) är feletiketterat. `bandyplay` = Elitseriens STREAMINGTJÄNST (borde vara intäkt/sponsorexponering från streamade matcher), INTE en barnverksamhet. En bandyskola för barn är en TREDJE sak (borde mata AKADEMIN + höja communityStanding — Jacobs instinkt). Idag är de hopblandade till EN aktivitet som varken streamar (ingen intäkt) eller matar akademin (ingen ungdomseffekt), bara går med förlust under fel namn. Reds ut mot bandy-kanonen: är det en aktivitet eller två, och vad gör var och en? (Opus text i EkonomiTab är tills vidare neutralt sann — den GÅR med förlust oavsett namn — så den skadar inte, men namnet/mekaniken är fel.)

Under grundningen: bandykunskapen finns i MINST sex spridda filer — `TEXT_REVIEW_formations` (formationer/positioner), `BANDYSPRAK_KALLASNING` (språk/idiom), `BANDYGRYTAN_SCRAPER` + `data/klubbrapporter/` (verklig data), `HANDOVER_BANDY_BRAIN`, `bandy_manager_SPEC` (arkiv). Men det finns INGEN samlad "så här fungerar bandy: regler, positioner, formationer, spelsätt"-kanon.

**Det var en del av Bandy-Brain-tanken (kartlägg reglerna och hur man spelar), och den är ogjord.** Konsekvensen: när en agent eller nästa-Jacob frågar "har spelet rätt bandy?" finns inget kanon-dokument att svara ur — man jagar sex filer (precis vad detta pass fick göra). Det är samma sjuka som liggaren löste för händelser: kunskap utspridd i fickor i stället för en kanon.

**FLAGGAD POST (eget framtida pass, ej ikväll):** skapa `BANDY_KANON.md` — ett samlat dokument: regler (offside finns, spelplan, tider), positioner (målvakt/backar/libero/halvor/forwards/ytterforwards), formationerna (de sex + deras anatomi), spelsätt (mentality/tempo/press/kemi hur de påverkar). Syntetisera ur de sex spridda källorna + Jacobs domänkunskap. Det blir kanon att verifiera "har spelet rätt bandy?" mot, och referensen Bandy-Brain siktade på. Ägare: Jacob (domänkunskap) + Opus (syntes/skrivning). Prioritet: inte akut, men det är den enda VERKLIGA öppna posten här — formations-frågan var stale.

## ÄGARSKAP
Code: stäng `c-fm1-formationer-fotboll` + `sluttest-b1-formationssystem` mot 2026-04-20-domen (formationer bandy-korrekta, tagg-bug löst). Jacob + Opus: `BANDY_KANON.md` som eget framtida pass — samla den utspridda bandykunskapen till en kanon. Inget ikväll; flaggad så den inte glöms.
