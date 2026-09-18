# Bilder som behövs — spårade luckor

Levande lista över bild-/asset-luckor som flaggats. Inte release-blockerande om inget annat sägs; post-launch-polish, men riktiga fel med yta.

## 1. Januari-anslaget (`league_midwinter`) — bild-mot-text-lögn

**Läget:** `leagueAnslag.ts` `league_midwinter` (kapitel "⬩ Januari ⬩") saknar egen bild och återanvänder Annandagens bild — en festlig, fullsatt läktare. Men januari-texten är motsatsen: "Mörkt över halva dagen", "helgmatcher där isen är mjuk i andra halvlek", "ingen tycker om januari", "solen kommer upp efter morgonträningen och går ner under eftermiddagsmötet". Festbild mot slit-text = spelet motsäger sig självt visuellt, samma klass som venue-lögnerna.

**Vad bilden ska bära (grundat i texten):** en kall, grå januari-eftermiddag vid en blygsam bandyvall. Lågt gråljus, halvmörker, glest eller tomt på läktaren (motsatsen till Annandagens fullsatta), sliten/blöt is, understatement. Ingen fest, ingen fullsatt kurva — vardagsslitet mitt i den långa säsongen. Samma bild-register/stil som de övriga anslag-scenbilderna (den Annandagen-bild den nu lånar), bara motsatt stämning.

**Två vägar (Jacobs val):** dedikerad januari-bild (genereras i pipelinen, prompt nedan i chatten) ELLER att anslaget faller tillbaka på en neutral vinterbild i stället för Annandagens festbild. Dedikerad bild är bättre — januari förtjänar sin egen ton.

**Code-beroende när bilden finns:** wira `league_midwinter` till den nya januari-asseten i anslag-bild-resolvern, bort från Annandagens bild-id.

## 2. (plats för fler luckor allteftersom de flaggas)
