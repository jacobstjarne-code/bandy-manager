# TEXTAUDIT — DEL 1 (av ~4)

**Datum:** 2026-06-11 · **Auditör:** Opus (Fable) · **Metod:** samma som designomgången — läs på, inventera per yta, fixa det uppenbara direkt, kö omdömesfall till Jacob.
**Inläst före start:** `WRITING_GUIDELINES_BANDY_MANAGER.md` (komplett, inkl. Lärdom 1–7), gold standard-filerna (cupAnslag, preMatchContextStrings, squadNuStrings, assistantCoachService-calm).

---

## §0 Röstkarta (auditens måttstockar — olika röster, olika regler)

| Röst | Yta | Regler |
|---|---|---|
| **Sture/klubbintern** | anslag, kafferum, anteckningar, stillness, efterklang | Full skrivguide: understatement, rytm, inga klyschor |
| **Assistenttränaren** | citat per personlighet | Personlighet styr register; **jovial får ha klyschor** (karaktärisering), philosophical får vara högstämd. Faktafel/engelska/fotboll fixas oavsett personlighet |
| **Journalister** | rubriker, pressklipp | Persona styr (sensationalist FÅR vara tabloid). Men: **inga ofaktade specifika påståenden** (siffror, minuter, sviter, hemma/borta som data inte backar) |
| **Spelare/styrelse/funktionärer** | quotes, scener | Talspråk, person — guidelinens vokabulärregler gäller |
| **System-UI** | knappar, etiketter, tomma states | Torrt och kort; tal & enheter per ratificerade regeln |

**Felklasser (i fallande allvar):** F1 fel sport/engelska · F2 faktapåståenden utan databackning · F3 systemfakta fel (poängsystem) · F4 stavfel/grammatik · F5 AI-slop (klyschor, dubbelmeningar, "inte X utan Y") · F6 repetition (samma sträng hög frekvens — hanteras i pool-uppdragen).

---

## §1 Fixat i DEL 1 (committat av Opus direkt)

### assistantCoachService.ts — 16 strängar
- **F1:** "Kontringen är *fotbollens* rent distillerade essens" → "bandyns renaste ögonblick" · "go hard!" → "hela vägen!" · "Straffsparkens" → "Straffens" · "Liten tweak" → "Liten ändring"
- **F3 (2-poängssystemet):** 6 × "tre poäng"-citat → "två poäng" (WIN calm/jovial, DRAW grumpy, PRESS_WIN calm/grumpy, last-minute calm)
- **F4:** "underpresterarde" → "underpresterade" · "Bra prestations" → "Bra prestation" · "vad det är möjligt" → "vad som är möjligt" · "Bevis det" → "Bevisa det" · "Laget är varm på det här" → "hänger med i svängarna" · "arbetet bakom scen" → "arbetet ingen ser"

### journalistHeadlineStrings.ts — 24 strängar omskrivna
- **F2 ofaktade siffror:** "Sju–ett", "sex mål", "fyra skott på mål två i kassen", "kvitterade i 89:e", "Vände 0–2", "seger nummer fyra", "skadeläget tärde", "Defensivstatistik säsongens sämsta" → generiska eller {scoreline}-token
- **F2 svitpåståenden:** "Tre raka", "fyra raka", "Andra raka", "Tredje förlusten på rad", "andra storförlusten i rad" → prevLoss-flaggan vet bara ≥1; omskrivna till "ännu en", "förlusterna staplas", "storförlust ovanpå förlust"
- **F2 hemma/borta:** "Övertygande hemmaseger", "Bortaplanen blev en mardröm", "sänkte hemmaplanen", "framför hemmapubliken", "Hemma och oavgjort" m.fl. → neutraliserade (pickHeadline saknar isHome — se §2)
- **Logikbugg:** "två poäng till {opp}" i VÅR vinstpool → "mot {opp}"

### gameStore.ts — 1
- **F4:** "tack at ja till inbjudan" → "tackade ja"

---

## §2 Code-ordrar ur DEL 1

1. **Grep-svep "tre poäng" (F3):** `grep -rin "tre poäng\|trepoäng" src/` → rapportera träfflistan, ersätt mekaniskt mot 2-poängssystemet där det avser seger. **Undantag som flaggas till Opus i stället för ändras:** strängar där "tre" inte är poängsumma (t.ex. "tre raka"), och `preMatchContextStrings` "Tre poäng i gåva" (Jacobs gold standard-citat — Jacob avgör formuleringen, se §3).
2. **isHome-param till pickHeadline (valfri flavor-återföring):** rubrikerna är nu plats-neutrala. Vill vi ha hemma/borta-färg tillbaka: param + taggade pooler, samma mönster som isCup-filtret. Lågt prio.
3. Inga övriga kodändringar — DEL 1-fixarna är rena strängbyten, `tsc` bör vara opåverkad men kör som vanligt.

---

## §3 Jacob-kön (omdömesfall, ej ändrade)

1. **"Tre poäng i gåva"** (preMatchContextStrings, ditt eget gold standard-citat i skrivguiden): 2-poängssystemet gör den faktafel. "Två poäng i gåva" tappar klang. Alternativ: "Poäng i gåva." Ditt ord.
2. **Jovial-klyschorna** ("spelade med hjärtat", "ger allt"): min läsning är att de är karaktärisering — den entusiastiske assistenten SKA låta så, och skrivguiden noterar redan "jovial har klyschor". Behållna. Säg till om du vill tona ner.
3. **"kvarten"-vokabulär** ("första kvarten", "slutkvarten") i journalistik: bedömt OK vardagssvenska för 45-minuters halvlekar. Bekräfta eller stryk.
4. **Kafferummets inbäddade tredjerepliker** (coffeeRoomService: `'Sa han vilken?" Vaktmästaren: "Nej...'` — citattecken-hack där en tredje talare bäddas in i en replik): kan rendera trasigt med scenens egna citattecken. Behöver ses i UI innan dom — fota en TRANSFER_PENDING/LEGEND-scen.

---

## §4 Inventering & status (uppdateras per del)

**Klart ✅:** assistantCoachService · journalistHeadlineStrings · gameStore (politiker-notisen) · coffeeRoomService (läst, godkänd ton; §3.4 öppen) · seasonSummaryService keyMoments + playerNotes 'trött' (ersätts av pool-uppdraget `CODE_UPPDRAG_FORSONING_OPUS_TEXT`) · gold standard-filerna (cupAnslag, preMatchContextStrings*, squadNuStrings — *poäng-frågan §3.1)

**DEL 2 (störst exponering, nästa pass):** matchCommentary.ts (46 KB — egen session) · matchLiveText · matchLaddningText + matchLaddningGrind · efterklangText · eventCardInlineStrings · portalBeats · roundCharacter

**DEL 3 (scener & relationer):** scenes/ (hela katalogen) · arrivalDialogue · boardMeetingCopy · boardQuotes · clubOfferQuotes · transferResponseText · retirementText · landslagText · suspensionText · injuryDoctorText · injuryStories · managerKaraktarText · managerKvittoText · hallDebateData · patronData · politicianData

**DEL 4 (värld & kuriosa):** anslag/ · media/ · anniversary*-kvartetten · klackEchoText · spectator*-filerna · stillness* · specialDateStrings · smallAbsurditiesData · seasonSummaryElimText · upptaktCopy · watchOthersReflectionText · windowDeadlineText · clubExtendedInfo · efterklang i services

**Metodnot:** services med inbäddade strängar (inboxService, pressConferenceService, journalistService, supporterService, sceneTriggerService-strängar) inventeras i DEL 2–3 — Code grep:ar `'...å...'`-litteraler vid behov.

— Opus/Fable, 2026-06-11
