# SCREENSHOT AUDIT — 2026-05-03

**Sprint 28 fas C — skärmdump-vänlighet-audit**
**Författare:** Opus
**Status:** Strukturell audit. Visuell verifiering återstår — markerade som TODO live.

---

## METOD-AVGRÄNSNING

Det FM-communityn delar är inte specialgenererade share-images utan **vanliga skärmdumpar av spelet i ett dramatiskt ögonblick**. Den här auditen frågar: i de 10 vyer som mest sannolikt blir skärmdumpade, vad gör dem dela-värda — och vad hindrar?

Strukturellt går att bedöma:
- Header/footer-närvaro
- Klubblogo + klubbnamn (för identifikation av delning)
- Att alla viktiga element renderas i samma viewport
- Att designsystem-tokens följs (inga hex-koder, korrekt padding)

Visuellt kräver live-verifiering:
- Estetisk balans, "ren" canvas
- Avhuggen text, clipping, utflödat innehåll
- Om vyn lyckas förmedla något *känslomässigt* som motiverar delning

Live-verifierings-punkter listas under varje vy som **TODO live**. Verifieras nästa playtest. Tar live ~1-2 min per vy med skärmdump bredvid.

---

## SCORING

**Skärmdump-värdighet 1-5:**
- **5** — Vyn är dramatisk, balanserad, fungerar som självförklarande share-bild utan kontext.
- **4** — Vyn är dela-värd vid rätt tillfälle (specifik match, specifik milstolpe). Kräver att spelaren *känner igen* ögonblicket.
- **3** — Vyn fungerar för spelaren själv (statusrapport) men är inte dela-värd för utomstående.
- **2** — Vyn är funktionell men estetiskt platt. Skulle inte förmedla något till en utomstående.
- **1** — Vyn är inte avsedd att skärmdumpas. Funktionsskärm.

---

## 1. MatchLiveScreen efter slutsignal

**Status:** 🟡 Med fix
**Skärmdump-värdighet:** 4 (vid dramatisk match)

**Strukturellt:**
- Slutsignal-text infogad i feeden enligt DESIGN_SYSTEM § 7 ("Domaren blåser av!" + 2-3 raders sammanfattning).
- "Se sammanfattning →"-knapp under feeden, inte overlay.
- GameHeader synlig med klubbnamn + omgång — bra för identifikation.
- BottomNav synlig (matchlive-pathen togs upp i KVAR fix #21).

**Problem:**
- Hela matchfeeden är scroll-bar — spelaren ser bara senaste 5-6 events i viewport. För skärmdump-tillfället är det det dramatiska *senaste* som är värdefullt, men kontexten (början av matchen) tappas.
- Resultat-siffran visas i header-zonen som liten text, inte som dominerande element vid slutsignal.

**Föreslagna fix:**
- Vid slutsignal: lägg en *resultat-block* ovanför feeden — score 36px Georgia 800 + utfallspill (V/F/O) + datum + omgång + arenanamn. ~40 min Code.
- Behåll feeden under för spelaren som vill rulla tillbaka — men block-blocket fångar skärmdump-värdet.
- Klubbloggor (managed + opponent) i resultat-blocket. Mocken finns inte än — ska skrivas innan implementation (princip 4).

**TODO live:**
- Ta skärmdump efter slutsignal vid 4-3 bortavinst i derbymatch. Bedöm om dramatik kommuniceras utan kontext.

---

## 2. GranskaScreen post-match

**Status:** ✅ Skärmdump-värd (efter SPEC_GRANSKA_OMARBETNING)
**Skärmdump-värdighet:** 4

**Strukturellt:**
- Resultat-hero med score 36px Georgia 800 (DESIGN_SYSTEM § 5).
- POTM-namn + betyg synligt.
- Andra matcher med vinnande lag bold (DESIGN_SYSTEM § 13).
- Splittad i 7 filer under `src/presentation/screens/granska/` — komponenter renderar separat.

**Problem:**
- Översiktsfliken är kort men spelaren öppnar troligen *Förlopp*- eller *Spelare*-fliken för djupare info — och dessa är *inte* skärmdump-värda i sig.
- Klubbloggor (hemma/borta) — verifiera att båda visas i resultat-hero, inte bara managed.
- Om en kritisk händelse-card visas i Översikt skapar det visuell oro i en annars ren resultat-hero — kan se "rörig" ut för utomstående.

**Föreslagna fix:**
- Översikt-fliken default-läge ska *inte* visa pendingEvents om syftet är att fungera som share-skärm. Lägg events under en collapsible eller bara i Reaktioner-fliken. Kontroversiellt — bryter mot beslutsekonomi-principen. Hellre: acceptera att *kritiska* events behöver hanteras innan vyn blir skärmdump-värd.

**TODO live:**
- Ta skärmdump av Översikt-fliken efter en match utan pendingEvents. Bedöm renhet.
- Ta skärmdump efter en match med 1-2 pendingEvents synliga. Bedöm om det blir för stökigt.

---

## 3. SeasonSummaryScreen

**Status:** 🟡 Med fix
**Skärmdump-värdighet:** 4 (vid mästerskap eller relegation)

**Strukturellt:**
- `seasonSummaryService.ts` har `pickSeasonHighlight()` (matchOfTheSeason) + topscorer + bästa spelare + arc-quote (enligt THE_BOMB 2.2 + 3.1).
- "ÅRETS MATCH"-block är specifikt för delning enligt THE_BOMB-vision.

**Problem:**
- Skärmen är hierarkisk navigation (DESIGN_SYSTEM § 1), så den har en rubrik. Bra för kontext, men gör skärmen mindre "ren".
- Om spelaren vinner SM finns det inget `🏆 MÄSTARE`-banner som skulle vara den *primära* delbara informationen.
- Klubbnamn + säsong syns i header-zonen, inte som inramning av själva sammanfattningen.

**Föreslagna fix:**
- Lägg en **resultat-banner** överst för säsongsmål utfall (mästare / playoff / mitten / nedflyttad). Banner-stil: stort centrerat, klubbnamn + säsong + utfall. ~30 min Code + mock.
- "Årets match"-blocket är ett distinkt skärmdump-mål — gör det visuellt mer fristående med tydlig border eller bakgrundsfärg så det fungerar som standalone-bild om spelaren cropar.

**TODO live:**
- Skärmdump av SeasonSummaryScreen vid SM-vinst (kräver lyckad save-state).
- Skärmdump vid 9:e plats (mid-table). Är det ens värt att skärmdumpa då?

---

## 4. PreSeasonScreen — "Läget i klubben"

**Status:** ✅ Skärmdump-värd (efter Sprint 27 verifierad implementation)
**Skärmdump-värdighet:** 3-4 (state of the club-bilden är delbar för fans, mindre för utomstående)

**Strukturellt:**
- `Läget i klubben`-card med diff-pilar enligt THE_BOMB 3.1 ("Tabellplats: 8:a → 3:a ↑", "Klubbkassa: 320 → 440 tkr ↑", etc.).
- Färgkodning + invert-logik för tabellplats (lägre = bättre).
- Dynamisk narrativ-text i fyra varianter.

**Problem:**
- Vyn är hierarkisk (efter säsongsslut, före pre-season) → har header.
- Kan finnas mycket text. Långt scroll-flow → en skärmdump fångar bara delar.

**Föreslagna fix:**
- "Läget i klubben"-cardet bör bygga som en standalone-block med klubblogo i hörnet — så det kan tas som standalone-share även om resten av PreSeason-flödet finns runt. ~20 min Code.

**TODO live:**
- Ta skärmdump efter andra säsongen. Bedöm om diff-info kommuniceras utan kontext.

---

## 5. PlayerCard med CareerJourney — för en legend

**Status:** ✅ Skärmdump-värd
**Skärmdump-värdighet:** 4 (för djupa fans, högt delbart)

**Strukturellt:**
- `CareerJourney`-tidslinje (Sprint 27/28 commit `be33b3b`) renderar narrativeLog.
- Spelarporträtt 36px med korrekt object-position (DESIGN_SYSTEM § 14).
- Karriärs-statistik + pension-rad om pensionerad.

**Problem:**
- PlayerCard öppnas som overlay/modal — det betyder att skärmdump också får med backdrop. Snyggt om backdroppen är clean (mörk semi-transparent), fult om appen runt syns.
- Pension-rad är specifik milstolpe värd att skärmdumpa, men hamnar långt ner i tidslinjen och kan kräva scroll.

**Föreslagna fix:**
- Verifiera att backdroppen är `rgba(0,0,0,0.6)` enligt DESIGN_SYSTEM § 11.
- För legendariska spelare (≥5 säsonger + ≥100 matcher per Sprint 28-B): lägg ⭐ legend-märke vid namnet i kortet. Visuellt distinkt = mer share-värt. ~15 min Code.

**TODO live:**
- Skärmdump av PlayerCard för en legend i en levande save (en spelare med ≥5 säsonger).
- Skärmdump av pensionerad legends PlayerCard. Bedöm om karriärs-tidslinjen är komplett synlig.

---

## 6. Pension-ceremoni-modal (Sprint 27 fas D)

**Status:** 🟡 Beror på fas D-leverans
**Skärmdump-värdighet:** 4 (för fans av specifik klubb/spelare)

**Strukturellt:**
- Sprint 27 fas D levererad enligt KVAR (commit `be33b3b`). Pension-ceremoni-modal med spelare + statistik + roll-erbjudande.
- Modal-stil enligt DESIGN_SYSTEM § 11: centrerad, max-width 380px, rgba backdrop.

**Problem:**
- Ej observerad live i denna session.
- Risk: modal är funktionell men inte "celebrerande" — om det är en sober statistik-läsning skärmdumpas den knappast.

**Föreslagna fix:**
- Om modalen i nuläget är funktionell: skapa en mer ceremoniell variant med klubblogo, spelarporträtt centrerat, "tack och lycka till"-tonal text, säsongsantal stort centralt. Mock först. ~1h Code + mock.

**TODO live:**
- Skärmdump av pension-ceremoni-modal vid en faktisk pension (kräver att en kapten/legend pensioneras i save). Bedöm ceremoniell tyngd.

---

## 7. TabellScreen med form-prickar

**Status:** ✅ Skärmdump-värd vid klättring
**Skärmdump-värdighet:** 3 (för fans), 4 (vid topp-position)

**Strukturellt:**
- `FormDots` komponent enligt DESIGN_SYSTEM § 12 (8px dots, nyast vänster).
- Position + poäng + målskillnad per lag.
- Klubbnamn synligt i header-zonen.

**Problem:**
- Tabellen är *funktionell* — dela-värdet kommer från klubbens position, inte från designen.
- Form-prickar är subtila (8px) — på mobil-skärmdump kan de bli små att läsa.

**Föreslagna fix:**
- Höjd form-pricks-storlek på TabellScreen från 8px till 10px. ~5 min Code.
- Lägg en `↑ N platser sedan förra omgången`-rad för managed club. Förmedlar dramatik. ~20 min Code.

**TODO live:**
- Skärmdump av tabellen efter att klubben klättrat 4 platser i en omgång. Bedöm om dramatik kommuniceras.

---

## 8. Coffee-room-quote med legend-referens

**Status:** ✅ Skärmdump-värd för fans (efter Sprint 26 cross-system)
**Skärmdump-värdighet:** 3-4

**Strukturellt:**
- `card-round` (DESIGN_SYSTEM § 2) — atmosfärisk, italic.
- Karaktärsnamn + replik (Sture, Materialaren, kioskvakten, etc.).
- Inbäddad i Dashboard/Portal.

**Problem:**
- Coffee-room-quoten är en *enrad* — för att vara dela-värt behöver kontexten finnas (vilken klubb, vilken karaktär). Karaktärsnamn finns men klubbnamn syns inte i kortet självt.
- En skärmdump av Portal med coffee-room-cardet i mitten av andra cards förmedlar en specifik bandy-Sverige-känsla som potentiellt är högt delbart bland tonen-uppskattare. Men för utomstående är det bara en quote utan kontext.

**Föreslagna fix:**
- Coffee-room-cardet i Portal har ingen klubbidentifikation. Lägg till en mikro-rad: `Söderfors · Forshallen` (klubb · arena) som footer på cardet, fontSize 8 letterSpacing 2px (sektionslabel-format). ~15 min Code.

**TODO live:**
- Skärmdump av Portal med coffee-room-quote om legend (kräver att en pensionerad legend nämns i quoten — Sprint 26 har detta). Bedöm hur tydligt klubbidentiteten kommer fram.

---

## 9. Inbox-rad med dramatiskt rubrik

**Status:** 🔴 Inte skärmdump-värd som vy
**Skärmdump-värdighet:** 2 (rubriken kan tas standalone, men hela inboxen är funktionell)

**Strukturellt:**
- `InboxScreen.tsx` är funktionell list-vy — inte designad för delning.
- Rubrikerna kan vara dramatiska (transferdrama, skandal, pensionsmeddelande) men hela vyn är platt.

**Problem:**
- Inbox-listor förmedlar inget visuellt drama. Spelaren skulle istället skärmdumpa det öppnade meddelandet.
- En enskild inbox-rad i listan har ikon + titel + datum — sparsmakat, inte skärmdump-värt.

**Föreslagna fix:**
- Det är fel skärm i specens lista. Det dramatiska finns i det öppnade meddelandet, inte i listan. Föreslår att fas C-listan revideras: byt "Inbox-rad" mot "Öppnat inbox-meddelande" där hela storyn synas i ett kort.
- Eller (om verkligen rad-format): skapa en "headline-card"-variant för dramatiska meddelanden där titel + ingress + ikon visas större, blir distinkt i listan, blir potentiellt skärmdump-värt. ~45 min Code + mock.

**TODO live:**
- Verifiera om öppnat inbox-meddelande är skärmdump-värt eller om det också är funktionellt platt.

---

## 10. Klubb-sidan (ClubScreen) med arena, klacknamn, patron

**Status:** ✅ Skärmdump-värd för bygd-fans
**Skärmdump-värdighet:** 4

**Strukturellt:**
- `ClubScreen.tsx` med arena (`arenaName`), klack (`supporterGroupName`), patron, mecenater enligt DESIGN_SYSTEM § 15.
- Backstory på mecenater enligt § 15.
- Klubblogo + klubbnamn synligt.
- Tab-navigation (Orten, Träning, Ekonomi, Anläggning, Minne).

**Problem:**
- Tab-navigationen splitar information. För skärmdump behöver spelaren välja *en* flik — Orten är förmodligen mest dela-värd.
- Mecenater + patron-list är textuell — sparsmakad, men inte visuellt påtaglig.
- "Minne"-fliken (Sprint 27 Klubbminnet) är högt dela-värd för fans men kräver navigering.

**Föreslagna fix:**
- "Orten"-fliken har potential att vara default-share-vy. Verifiera att klubblogo + klubbnamn + arena + klack syns utan scroll. ~10 min verifikations-jobb.
- I "Minne"-fliken: lägg klubblogo + klubbnamn ovanför minnes-listan så att en skärmdump bär identifikation. ~10 min Code.

**TODO live:**
- Skärmdump av ClubScreen Orten-fliken. Bedöm om "bygdens identitet" kommer fram utan att spelaren behöver scrolla.
- Skärmdump av Minne-fliken efter två säsonger. Bedöm dela-värde.

---

## SAMMANFATTNING — fix-prioritering

| Vy | Värdighet | Föreslagen fix | Estimat |
|---|---|---|---|
| 1. MatchLiveScreen efter slutsignal | 4 (m. fix) | Resultat-block ovanför feeden + klubbloggor | 40 min + mock |
| 2. GranskaScreen post-match | 4 | OK som det är. TODO live verifiera renhet med events | — |
| 3. SeasonSummaryScreen | 4 | Resultat-banner överst + standalone "Årets match"-block | 30 min + mock |
| 4. PreSeasonScreen | 3-4 | Klubblogo i hörnet av "Läget i klubben"-card | 20 min |
| 5. PlayerCard | 4 | ⭐ legend-märke vid namn | 15 min |
| 6. Pension-ceremoni | 4 (m. fix) | Mer ceremoniell variant med porträtt + tonal text | 1h + mock |
| 7. TabellScreen | 3-4 | Höj form-prick-storlek + "klättrat N platser"-rad | 25 min |
| 8. Coffee-room-quote | 3-4 | Klubb · arena footer på cardet | 15 min |
| 9. Inbox-rad | 2 | Skärmen är fel mål — granska istället öppnat meddelande | — |
| 10. ClubScreen | 4 | Klubblogo i Minne-fliken header | 10 min |

**Total fix-tid:** ~3h 15 min Code + 4 mocks (Opus). Tas som Sprint 29 om Jacob bedömer det värt.

---

## EFTERREFLEKTION

Auditen är **strukturell**, inte visuell. Alla föreslagna fix-uppskattningar antar att den underliggande layouten redan fungerar — risken är att en live-skärmdump avslöjar problem som inte syns i kodstrukturen (dålig padding-balans i en specifik state, clipping vid ovanliga klubbnamn, layoutbrott vid långa spelarnamn).

**Rekommendation:** Innan Sprint 29 påbörjas, ta 30 min playtest med skärmdump per vy. Notera vad som inte fångats av denna audit. Sedan beslut om vilka fix som faktiskt ska implementeras.

Mocks för fix #1, #3, #6 är obligatoriska enligt princip 4 innan implementation. Övriga fix (Klubblogo-tillägg, micro-typografi-justeringar) är små nog att Opus fixar direkt utan mock.
