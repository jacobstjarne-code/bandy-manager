# BEGRIPLIGHETSREVISION — ambitiöst pass, 2026-09-12

**Vad detta är:** en systematisk jakt på hela klassen av fel som entré-fyndet tillhör — saker som fungerar mekaniskt men är obegripliga för en människa som möter dem. Testapparaten (Grind 2, stress, 5 248 testfall) mäter *att systemen fungerar*. Den mäter inte *att en människa förstår vad hon möter*. Entré-hålet (Carina agerar innan du känner henne) satt kvar till en manuell playalong eftersom ingen grind ställer den frågan. Detta pass frågar: **vilka fler hål av samma klass finns, och vilka kan bli invarianter som entrén blev?**

**Arbetsdelning:** Jacob + Codex kör playalongs (upplevelsen — det jag inte kan). Detta pass är det Opus och Code KAN göra utan att spela: läsa varje yta en förstagångs- eller förlorande spelare möter, resonera fram var begripligheten brister, och avgöra per fynd om det kan kodifieras till en grind eller bara spelas fram. Opus resonerar och dömer text; Code verifierar mot koden och bygger grindar.

**Varför detta inte är en playalong:** en playalong hittar hål genom upplevelse men är beroende av att spelaren råkar märka dem (Carina var tur). Detta pass hittar hål genom att uttömmande gå igenom en katalog av begriplighetsklasser mot koden — det som går att resonera sig till utan att spela. De två metoderna kompletterar varandra: passet pekar var playalongen ska titta, playalongen bekräftar det passet inte kan känna.

---

## Modellen: hur entrén blev en invariant (mallen för allt nedan)

Entré-fyndet gick från "obegripligt hål" till "omöjligt att bryta" i tre steg:
1. **Upplevelsen namngav hålet:** en aktör agerar innan spelaren vet vem den är.
2. **Regeln kodifierades:** namn + följder gate:as på det beständiga röstregistret (`voiceIntroductionService.ts`), samma gate på alla ytor inkl. push.
3. **Grinden gjorde det omöjligt:** en ointroducerad röst kan inte producera synlig yta — testat, regression.

Den avgörande frågan för varje klass nedan: **kan den passera steg 2?** Somliga kan (en regel en maskin kan kontrollera). Somliga kan inte (kräver mänsklig bedömning — "är matchen spännande") och stannar på playalong-nivå. Bägge svaren är giltiga; poängen är att veta vilket.

---

## Katalogen: begriplighetsklasser att jaga

Åtta klasser. Entré var klass A. För var och en: definitionen, om den kan bli grind, och var Code läser för att hitta instanser.

### A. Aktör utan entré ✓ REDAN LÖST
Aktör agerar innan spelaren mött den. Löst via röstregistret. **Grind: ja, byggd.** Kvar: verifiera att katalogen i `ENTRE_PRINCIPEN` är uttömmande — finns en namngiven aktör som producerar en yta utan att gå via `getVoiceEligibleEvents`? Code: grep alla `pendingEvents.push`/event-fabriker för `sender.name` satt utan motsvarande `voiceId`.

### B. Följd utan orsak
En siffra/status ändras utan att spelaren vet varför. Kassan sjönk — av vad? Moralen föll — efter vad? Spelaren ser effekten men aldrig händelsen. Detta är entré-fyndets syskon: där handlade det om VEM, här om VARFÖR. **Grind: delvis.** En mätarändring över en tröskel utan en tillhörande liggarpost samma matchdag är kod-detekterbar. Code: för varje mätare (`fanMood`, `communityStanding`, `supporterGroup.mood`, `finances`), finns en `eventLedger`-post eller synlig rad som förklarar varje ändring > X? Där ingen finns är effekten föräldralös.

### C. Val utan begripliga konsekvenser
Ett beslutskort erbjuder val vars följder spelaren inte kan förutse ens grovt. Inte "exakt utfall" (det ska vara dolt) utan "vilken sorts sak händer". "Säg ja till mecenaten" — kostar det pengar, lojalitet, speltid? Om kortet inte antyder konsekvensklassen är valet en gissning, inte ett beslut. **Grind: nej, bedömning.** Men Code kan lista alla `choices` vars `effect` rör en mätare som kortets text inte nämner — en kandidatlista Opus dömer.

### D. Status utan skala
Ett tal visas utan referensram. "Rykte 47" — av vad? "Moral 62" — är det bra? Ett tal utan sin skala eller sin normalzon är en glyf, inte information. **Grind: delvis** — Code kan lista varje visat numeriskt fält och flagga de som saknar min/max/normal-kontext i UI. Opus dömer vilka som behöver den (rykte ja, matchminut nej).

### E. Verktyg utan syfte
En flik/funktion är öppen men spelaren vet inte vad den är TILL för eller när den spelar roll. Entré-passet löste detta för de sportsliga verktygen (assistenten introducerar). Kvar: finns en yta som är interagerbar men oförklarad, som inte fångades? Code: varje flik i `OrtenTab`/navigationen — har den en introduktion ELLER är den självförklarande? Lista de som är ingendera.

### F. Händelse utan efterdyning
Något viktigt händer och lämnar inget spår. Ett terminalt val (burnout), en konflikt, ett avsked — och nästa skärm låtsas som ingenting. Motsatsen till "levererat ≠ integrerat": här FINNS händelsen men den ekar inte. Grind 2 verifierade att burnout NÅS; den verifierade inte att världen ändras efteråt. **Grind: delvis** — Code kan verifiera att terminalval/stora beats sätter minst en efterföljande synlig konsekvens (liggarpost, ändrad status, portalbeat). Opus dömer vilka som ska eka och hur länge.

### G. Tystnad utan förklaring
Spelaren förväntar sig något som inte kommer, utan att veta varför. Inga bud på övergångsmarknaden — är det tomt eller trasigt? Ingen scout-rapport — jobbar hon eller glömdes hon? Frånvaro är svårast av allt att göra begriplig, för det finns inget att klicka på. **Grind: nej, nästan helt playalong.** Men en kandidat: ytor som kan vara legitimt tomma bör säga att de är avsiktligt tomma ("inga bud än" ≠ blank yta).

### H. Notis utan krok
En push/notis refererar till något spelaren inte har kontext för när den läses utanför spelet. Entré-gaten täcker ointroducerade aktörer; kvar är notiser om SYSTEM eller SITUATIONER spelaren inte mött. "Licenskravet närmar sig" — vilket licenskrav? Attention Engine ärver hela begriplighetsbördan eftersom den talar när spelet är stängt. **Grind: delvis** — samma mönster som entré-gaten, utvidgad från aktörer till system/koncept.

---

## Vad Code kan köra NU (utan playalong, ren kodläsning)

En rad per klass, alla är grep/läs-uppgifter som producerar en kandidatlista Opus sedan dömer. Ingen av dem ändrar kod — de KARTLÄGGER. Claima en MASTER-rad per klass som tas.

1. **Klass A-verifiering:** grep event-fabriker + `pendingEvents.push` för `sender.name`/namngiven avsändare utan `voiceId`/`introducesVoiceId`. Varje träff = en aktör som kan tala utan registrets gate. Förväntat resultat: noll (gaten är byggd), men verifiera att den är uttömmande.
2. **Klass B-kartläggning:** lista varje kodväg som muterar `fanMood`, `communityStanding`, `supporterGroup.mood`, klubbens `finances` med > en tröskel, och kryssa om samma väg skriver en `eventLedger`-post eller synlig rad. Föräldralösa mutationer = kandidatlista.
3. **Klass D/E-inventering:** lista varje flik och varje visat numeriskt statusfält i Portal/OrtenTab, kryssa "har introduktion/kontext: ja/nej". Nej-raderna = kandidatlista.
4. **Klass F-kartläggning:** lista alla event/beats med `significance >= X` (terminalval, avsked, konflikt, stora sälj) och kryssa om var och en sätter minst en efterföljande synlig konsekvens. Ekolösa = kandidatlista.
5. **Klass H-kartläggning:** lista varje Attention/push-mall och kryssa om den refererar ett system/koncept (licens, ekonomi-tröskel, marknad) som spelaren kan möta i notisen innan hon mött det i spelet. Kroklösa = kandidatlista.

Klass C och G lämnas åt playalong + Opus-dom (de är bedömning, inte detektering) men Code kan förbereda C:s kandidatlista (val vars effekt rör en mätare korttexten inte nämner).

---

## Vad Opus gör med kandidatlistorna

För varje kandidat, en dom i tre utfall:
- **Kan bli grind** → formulera invarianten skarpt (som entré-gaten), Code bygger + testar. Detta är målet: flytta så mycket som möjligt från "hoppas någon märker" till "omöjligt att bryta".
- **Kräver text, inte grind** → Opus skriver den förklarande copyn i maner (orsaksrad, skala-kontext, avsiktlig-tomhet-text). Svensk text spec:as aldrig till Code.
- **Bara playalong** → kan inte kodifieras (spänning, känsla, rytm); noteras som en lins för Jacob/Codex nästa genomspelning i stället.

---

## Vaktlinjen (samma som entré-passet)

Begriplighet är inte samma som att förklara allt. Överförklaring dödar atmosfär lika säkert som obegriplighet dödar mening. De starkaste sektionerna parar atmosfär med handling utan att förklara. En orsaksrad ska vara lika kort och understated som resten av spelets röst — inte en hjälpruta. Målet är att inget agerar mot spelaren oförklarat, inte att allt är annoterat. När tvekan: en spelare som undrar "varför" ska kunna hitta svaret om hon letar, men behöver inte få det påtvingat.

---

## Leverans

- En MASTER-rad per klass som tas (B, D/E, F, H som kartläggningar; C, G som playalong-linser).
- Varje kartläggning producerar en kandidatlista → Opus-dom → grind ELLER text ELLER playalong-lins.
- De klasser som blir grindar är passets verkliga utfall: begriplighet kodifierad, i entré-invariantens efterföljd.
- Detta dokument är kartan. Det ersätter inte playalongen — det pekar var den ska titta och fångar det den inte behöver spela sig till.
