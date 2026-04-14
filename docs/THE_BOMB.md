# THE BOMB — Vad som gör Bandy Manager oförglömligt

Inte en feature-lista. En designriktning. Systemens som redan finns behöver PRATA med varandra.

---

## INSIKT: Spelet har djupa system som opererar i stuprör

Orten vet inte om matchen. Presskonferensen vet inte om klacken. Kafferummet vet inte om transferdramat. Commentary vet inte om vädervalet vid halvtid. Spelaren fattar beslut i ett system och ser konsekvenserna i samma system — aldrig i ett annat.

THE BOMB = när konsekvenserna överraskar. Du säljer klackens favoritspelare → klacken reagerar → orten-puls sjunker → ekonomin påverkas → styrelsen ifrågasätter. Det är inte en bugg, det är en KEDJA. Spelet har redan alla delar. De behöver kopplas.

---

## 1. KORSREFERENSER — system som nämner varandra

### 1.1 Presskonferensen nämner orten

Om CS > 75: *"Det pratas om er i hela kommunen. Är det press eller inspiration?"*
Om CS < 35: *"Publiken sviker. Hur påverkar det laget?"*
Om mecenat just anslutit: *"Ni har fått en ny mecenats stöd. Gör det skillnad i omklädningsrummet?"*

Implementation: `pressConferenceService.ts` → lägg till 4-5 community-triggers i QUESTIONS-poolen.

### 1.2 Kafferummet reagerar på transferdrama

Om spelare sålts förra omgången:
*Kioskvakten: "Hörde att Lindberg försvann." Materialaren: "Hoppas pengarna räcker till nya tröjor."*

Om nyförvärv:
*Vaktmästaren: "Ny kille i omklädningsrummet. Sa knappt hej." Kassören: "Ge honom en vecka."*

Om deadline-panik (omg 14-15):
*Kassören: "Telefonen ringer hela tiden." Ordföranden: "Svara inte."*

Implementation: `coffeeRoomService.ts` → lägg till `TRANSFER_EXCHANGES` array som triggas vid transferhändelser.

### 1.3 Match-commentary refererar till säsongskontexten

Nuvarande commentary är generiskt. Lägg till kontextkommentarer:

| Kontext | Commentary |
|---------|-----------|
| Akademispelare gör mål | "Egenodlad talent! Akademin levererar!" |
| Kapten gör mål | "Kaptenen kliver fram! Det är därför han bär bindeln." |
| Klackens favorit gör mål | "Klackfavoriten! Hör hur publiken skanderar!" |
| Spelare med day job gör mål | "{namn} — lärare på dagarna, målskytt på kvällarna." |
| Sent mål i tight match | "SLUTMINUTERNA! Stämningen är ELEKTRISK!" |
| Mål i dåligt väder | "PÅ DEN HÄR ISEN! Otroligt att bollen ens gick in!" |

Implementation: I `matchStepByStep.ts` → efter mål-event, kolla spelarprofil och välj specialkommentar. Kräver access till player.trait, player.dayJob, supporterGroup.favoritePlayerId.

### 1.4 Klacken sjunger specifikt

Klacken har redan `ritual`. Använd det:

*"🎵 Klacken drar igång välkomstsången. 34 röster — inte mycket, men dom hörs."*
*"📯 Birgers trumma ekar över isen. Hemmaplansfördel +3."*
*"📣 Tyst på läktaren efter tredje raka förlusten. Birger trummar ensam."*

Implementation: `matchCommentary.ts` → ny `supporter`-category som triggas vid matchstart, halvtid, och sent i matcher. Refererar `supporterGroup.mood`, `.members`, `.leader.name`.

---

## 2. MILESTONE-MOMENTS — spelet vet när något är speciellt

### 2.1 "Den matchen" 

Ibland händer saker som är SPECIELLA och spelet borde veta det:

- Akademispelares första mål → narrativ: "Det här ögonblicket. 17 år. Första A-lagsmålet. Klacken exploderar."
- 90:e minutens kvittering → "KAOS! Sista sekunden! Hela bänken rusar ut!"
- Hat trick → "TRE BOLLAR! {namn} HAR GJORT TRE!"
- Första derbysegern → "Äntligen. {derbyname} tillhör oss."
- SM-final (om man når dit) → hela matchen presenteras annorlunda

Dessa finns DELVIS (narrativeService har generateHatTrickEntry etc). Men de visas bara i spelarloggen. De borde OCKSÅ trigga:
- Specialkommentar i matchen (redan delvis)
- Rubrik i tidningsraden på dashboarden
- Klack-reaktion nästa omgång
- Arc-text-uppdatering

### 2.2 Säsongens höjdpunkt

Vid säsongssammanfattning — plocka ut EN match som "årets match" baserat på:
- Marginalen (knapp seger/förlust)
- Tajming (sent avgörande)
- Kontext (derby, slutspel, relegation-fight)
- Personaliseringt (akademispelares genombrott, kapten avgjorde)

Visa den som highlight i sammanfattningen:
```
🏒 ÅRETS MATCH
Forsbacka 4 – 3 Västanfors (Omg 18, Derby)
S. Kronberg med avgörande mål i 87:e. 
"Den matchen ändrade allt." — Birger, klackledare
```

Implementation: `seasonSummaryService.ts` → `pickSeasonHighlight(game)` som poängsätter alla matcher och väljer den mest dramatiska.

---

## 3. ANDRA SÄSONGEN — vad gör att man spelar igen

### 3.1 State of the Club

Vid säsongsstart (PreSeasonScreen) — visa vad som ÄNDRATS sedan förra året:

```
┌──────────────────────────────────┐
│  📊 LÄGET I KLUBBEN              │
│                                  │
│  Tabellplats: 8:a → 3:a  ↑      │
│  Klubbkassa: 320 → 440 tkr ↑    │
│  Orten: 45 → 72 ↑               │
│  Trupp: 3 nya, 2 sålda          │
│  Akademi: 1 uppflyttad           │
│  Klacken: 25 → 41 medlemmar ↑   │
│                                  │
│  "Förra säsongen överträffade    │
│   förväntningarna. Nu väntar     │
│   styrelsen mer."                │
└──────────────────────────────────┘
```

Implementation: Spara `seasonStartSnapshot` vid säsongsstarten. Jämför vid nästa start. Rendera i PreSeasonScreen.

### 3.2 Spelarnas livscykel syns

En 17-åring du flyttade upp i säsong 1 är 19 i säsong 3. Hans `narrativeLog` har 8 entries. Hans dag-jobb har bytts. Hans form har gått upp och ner. VISA DET:

Spelarkort → "Karriärresa":
```
2026: Debut mot Gagnef (17 år). Kallade in från P19.
2026: Första målet mot Lesjöfors. Klacken adopterade honom.
2027: 14 mål. Första hela säsongen. Sa upp sig som lärare.
2027: Kapten. "Han ÄR Forsbacka nu." — Birger
```

Implementation: `narrativeService.ts` redan genererar entries. Behöver bara en komponent som renderar dem snyggt i spelarkort-vyn.

### 3.3 Pension/Legend-system

Veteraner som gått i pension borde inte bara försvinna. Om en spelare med 100+ matcher och trait 'veteran' eller 'ledare' pensioneras:

```
📋 PENSIONERING
Staffan Henriksson, 34 år
147 matcher · 23 mål · 3 säsonger
"Jag slutar. Men jag stannar i föreningen."

→ Erbjud roll som ungdomstränare (+akademi)
→ Erbjud roll som scout (+scoutbudget)
→ Tack och lycka till
```

Spelaren blir en namngiven karaktär i orten. Refereras i kafferummet:
*"Henriksson var nere på träningen igår. Grabbarna lyssnade."*

Implementation: `retirementService.ts` → generera pensionsevent med val. Lägg till pensionerad spelare som `namedCharacter` med ny roll.

---

## 4. POLISH SOM SKAPAR ATMOSFÄR

### 4.1 Vädret MÄRKS mer

Väder påverkar redan matcher mekaniskt. Men spelaren märker det bara som en tag. Gör det visuellt:

- Snöfall: ❄️-partiklar faller långsamt över matchvyn (CSS animation, mycket subtilt)
- Kyla < -15°: Andedräkts-emoji i commentary ("Andedräkten syns som dimma")
- Dimma: Reducerad opacity på scoreboardet (!)
- Töväder: 💧-indikator som växer under matchen

### 4.2 Matchdagens känsla

Innan matchen börjar — en 2-sekunders "ögonblick" på MatchLiveScreen innan kommentaren rullar:

```
Stålvallen, Forsbacka
-7° · Stjärnklart · Bra is
Omgång 14 · 847 åskådare

[    AVSLAG →    ]
```

Inte en skärm, bara en fade-in med delay innan matchsimuleringen startar. Sätter stämningen.

### 4.3 Ljudeffekter

Diskret, opt-in (avstängt som default):
- 🏒 Mål: kort jubel-sample (1 sek)
- ⏱ Halvtid: visselpipa
- 📯 Hörna: trumma (Birgers)
- 🔔 Slutsignal: lång visselpipa

Implementation: `soundEffects.ts` finns redan — verifiera att det fungerar och lägg till fler events.

---

## 5. SHARE-MOMENTS

### 5.1 Säsongssammanfattning som bild

"Dela din säsong" → generera en 1080×1920 bild med:
- Klubbens badge + namn
- Slutplacering + poäng
- Toppscorer + bästa spelaren
- "Årets match" (från 2.2)
- Kaptensnamn
- Arc-quote
- "Bandy Manager" watermark

Implementation: `seasonShareImage.ts` finns redan — verifiera + förbättra med nya data.

### 5.2 Match-highlight som bild

Efter en dramatisk match: "Dela matchen" → bild med score, nyckelmoment, MOTM.

---

## 6. TRANSFERDÖDLINE + RYKTE (redan specade)

Flyttas hit från FIXSPEC_PARKERAT.md:
- P2: Transferdödline-känsla (header-countdown, panikbud, rabattvärvningar)
- P3: Klubbens rykte utanför orten (6 triggers, narrativa inbox-meddelanden)

Dessa är fullspecade och redo att implementeras.

---

## PRIORITERING

Se också `docs/SPEC_KLUBBUTVECKLING.md` för ekonomisk progression, utbyggnadsträd, och säsongsrytm. Dessa två dokument är komplementära:
- **THE_BOMB** = narrativ, atmosfär, känslomässiga beröringspunkter
- **SPEC_KLUBBUTVECKLING** = ekonomi, byggen, strukturell progression

Tillsammans definierar de vad som gör spelet värt att spela i 5+ säsonger.

### Sprint 3 (efter buggar + fas 2)
1. **Korsreferenser** (1.1-1.4) — mest bang for buck, 90% textdata
2. **Milestone-moments** (2.1-2.2) — "årets match" + specialkommentarer
3. **State of the Club** (3.1) — retention-feature för säsong 2+

### Sprint 4
4. **Transferdödline** (P2 från PARKERAT) — drama
5. **Rykte utanför orten** (P3 från PARKERAT) — progression
6. **Pensionering/Legend** (3.3) — emotional payoff
7. **Spelarens livscykel** (3.2) — djup

### Framtid / Nice-to-have
8. Väder-polish (4.1) — visuellt
9. Matchdagens känsla (4.2) — stämning
10. Ljudeffekter (4.3) — opt-in
11. Share-images (5.1-5.2) — viral
