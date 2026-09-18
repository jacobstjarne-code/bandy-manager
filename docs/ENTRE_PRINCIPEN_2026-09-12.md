# ENTRÉ-PRINCIPEN — verifieringschecklista (2026-09-12)

> **IMPLEMENTATIONEN OCH MASTER ÄR KANON, INTE DEN HÄR FILEN.** Codex byggde principen 2026-09-12
> mot spelets BEFINTLIGA beständiga röstregister — INGEN ny `introduced`-flagga skapades (en
> parallell flagga hade blivit en andra sanning som kan drifta från registret). Den här filen är
> en verifieringschecklista och överenskommelse, inte källan. Vid konflikt gäller implementationen.
> Rättad i efterhand från en tidigare version som felaktigt talade om en `introduced`-flagga och om
> synliga platshållartexter — båda fel, se preciseringarna nedan.

**Ursprung:** Jacobs playalong-fynd. Namngivna aktörer materialiserades utan att spelaren mött dem — en mecenat kunde bli skeptisk, kommunen kräva en gentjänst, utan föregående introduktion. Ur spelarens synvinkel refererar det till någon som inte finns än. Obegripligt, och det sväller notiserna med brus spelaren inte kan tolka.

**Överenskommelse mellan Jacob, Codex och Opus.** Codex byggde gate + testskydd mot röstregistret; Opus kan senare finslipa rösten utan att ändra ordning eller logik; Jacob dömer gränsfall.

---

## Den gemensamma regeln

Två kategorier, samma båge:

- **Relationer** (person/organisation): institution → namngiven kontakt → möte → samarbete/system → senare berättelsebeats.
- **Funktioner** (verktyg): behov uppstår genom en konkret situation → någon tar upp det → möjliga vägar visas → verktyget blir aktivt.

Kärnan i en mening: **ingenting får agera mot spelaren, eller notifiera spelaren, innan spelaren vet vem eller vad det är.**

---

## Invarianten (byggd på befintligt register, INTE en ny flagga)

**En namngiven aktörs namn, eller någon följd av aktören (bidrag, krav, skepsis, gentjänst, avsked), får inte visas på någon yta förrän aktören är introducerad enligt spelets beständiga röstregister.**

- **Gaten är det befintliga röstregistret** med kanoniska röst-id:n, inte en ny `introduced`-flagga. En sanning, ingen synk-risk.
- **Gränsen går vid namn och följder, inte institutionen.** Institutionen "kommunen" får synas från start; Carinas namn, bidrag, krav och avsked får inte före mötet. Kuliss är fritt, relation kräver entré. (En helt tom värld vore lika obegriplig som en aktör man aldrig träffat — därför gate:as personen, inte institutionen.)
- Samma gate för ALLA ytor: Portal, Inkorg, klubbvyer, Granska, och push (Attention Engine).
- **Attention-kopplingen (Opus komplettering, den sak som saknades):** notismotorn saknade ett uttryckligt framtidsskydd — en gammal liggarpost kunde bli en notis om en ännu ointroducerad aktör. Push använder nu samma kanoniska röstidentitet som resten av spelet: en gammal post får ligga kvar utan att bli notis före entrén. Testat för mecenat, patron och direkt röst (politiker, klackledare).
- **Ingen synlig platshållartext i releasekandidaten.** Introduktionerna har komplett fungerande text; Opus kan finslipa rösten senare utan att röra ordning eller logik. Struktur och röst landar ihop, aldrig ett hål.

---

## Checklista — verifiera per aktör/funktion att entrén finns OCH att gaten håller

För varje rad: (a) finns en berättad entré? (b) är namn + följder gate:ade på röstregistret på alla ytor inkl. push?

### Relationer
- [ ] **Kommunen** — institutionen får synas; första namngivna kortet är en MÖTESFÖRFRÅGAN, inte en sakfråga/gentjänst. Sakfrågor väntar tills mötet är avklarat.
- [ ] **Klacken** — första kortet uttryckligen en mötesförfrågan (klackledarens röst). Tifo/konflikt-beats får inte föregå mötet.
- [ ] **Lokalpressen** — första kontakt före första citat/presskonferensreferens.
- [ ] **Mecenat/patron** — introduktionsscenen (`generateMecenatIntroEvent`) MÅSTE föregå krav, skepsis, gentjänst; `generateMecenatKravEvent` m.fl. gate:ar på registret. (Verifierat + testat.)
- [ ] **Övriga namngivna funktionärer** (kassör, ordförande, ungdomsansvarig) — namn får inte visas i någon vy före första kontakt.

### Undantag (introduceras redan i Tillträdet — dubbelintroducera INTE)
- Styrelsen
- Assisterande tränaren
- Trupp / startelva (bekräftat: introduceras ordentligt i Tillträdet)

### Funktioner (förklaras när spelaren själv öppnar funktionen)
- [ ] **Träning** — assistenttränaren öppnar inför första träningsveckan.
- [ ] **Taktik** — assistenttränaren, första besöket.
- [ ] **Kontrakt** — assistenttränaren/kassör, första besöket.
- [ ] **Marknad / Värvning** — öppnas först när övergångsmarknaden faktiskt presenteras.
- [ ] **Scouting** — samma som marknad.
- [ ] **Akademi** — egen ingång via ungdomsansvarig/intag.
- [ ] **Bygget** — behåller sin riktiga säsong-2-start genom Valet-bågen; fliken visar inte fullt träd före Valet, har en tydlig väntestatus dessförinnan.
- [ ] **Ekonomi** — kassören introducerar.

---

## Vaktlinjen (Jacobs egen, 2026-09-12): introducera glest

Överintroduktion är den motsatta faran. Om varje flik får en namngiven genomgång blir starten en korridor av mellanchefer som skakar hand. Bågens värde ligger i att den är gles.

- Introducera det som är FÖRVIRRANDE att möta oförberett, inte allt.
- De starkaste sektionerna (splash, namnval, klubbval) parar atmosfär med handling — de förklarar inte. Introduktionerna ska ha samma disciplin.
- Högst EN ny person introduceras per matchdag (implementerat i grundflödet — bevara det).
- Är en funktion självförklarande utan att kännas obegriplig: ingen introduktion. Tvinga inte in en.

---

## Text vs struktur

Codex byggde gaten, ordningen och testskyddet mot röstregistret, med komplett fungerande introduktionstext. **Rösterna — assistenttränarens genomgångar, kassörens ekonomiintro, klackledarens mötesförfrågan, kommunens första kontakt — är svensk speltext.** Opus kan finslipa dem i det etablerade maneret (bandysvensk understatement, ingen AI-ton) UTAN att ändra ordning eller logik. Inga platshållare fylls i efterhand — det finns inga i kandidaten.

---

## Leverans

- MASTER-rad, rotorienterad (invarianten mot röstregistret), inte en rad per läcka.
- Grinden/testskyddet som håller invarianten är det som stänger raden.
- Testskydd byggt: en ointroducerad aktör producerar ingen synlig yta eller notis; regression för mecenat, patron, direkt röst.
- Kontroll grön 2026-09-12: 585 testfiler, 5 248 testfall, TypeScript + produktionsbygge. Ännu ej pushad/driftsatt vid dokumentets rättelse.
