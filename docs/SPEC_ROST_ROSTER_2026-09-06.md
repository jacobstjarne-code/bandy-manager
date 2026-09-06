# SPEC_ROST_ROSTER — kanonisk voiceId-roster + start/kö/undantag

**2026-09-06 · Opus · parar `DOM_ROSTINTRODUKTIONER_2026-09-06.md` · Opus-handoff-halvan**

Rosten över namngivna återkommande röster som röstintro-grinden gäller, med
klass per röst. Grundad i kod (portalBuilder/inboxToPortal/patronData/journalist-
service), inte gissad. **Status: FÖRSLAG — start/kö väntar Jacobs kall i speltest,
två rader väntar kod-bekräftelse (se §Flaggor).**

Bakgrund: portalen märker korten med KATEGORI (`inboxToPortal.KIND_LABEL`:
🏆 RESULTAT, 📰 MEDIA, 💼 MECENAT…). Kategorin är sorteringen och ska VARA KVAR —
utan den blir portalen en lista med pratande huvuden utan ordning. Felet var
aldrig att kategorin finns; det var att kategorin var det ENDA som fanns: det stod
MEDIA men inte vem, MECENAT men inte att det var den namngivna mecenaten spelaren
(inte) mött. Fixen är två lager, inte ett utbytt: kategori-etiketten kvar, ett
avsändarnamn tillagt där en introducerad röst talar ("📰 LOKALPRESSEN · {journalist}").
Grinden styr OM rösten får dyka upp, inte HUR kortet är märkt — kategorierna
faller aldrig bort.

## Rostern

| voiceId | Vem | Källa i kod | Klass | Intro-hemvist |
|---|---|---|---|---|
| `assistant_coach` | Assistenten | coffee_room_card, prep.*, assistentanteckningar | **SEED** | Tillträdet |
| `board` | Ordföranden/styrelsen | board_objectives, BoardFeedback, styrelsemöten | **SEED** | Tillträdet |
| `local_press` | Lokalpressen/journalisten | journalist_card, Media/MediaEvent, journalistService, feud/redemption | **KÖ** | Nytt introkort (Opus-copy) |
| `patron` | Mecenaten (namngiven: Hedlund/Nordin…) | PatronInfluence, patronData.PATRON_PROFILES, patron_emerge (CS ≥ 60) | **KÖ** | **Återanvänd `patron_emerge`** — den ÄR introt (namn+bolag+backstory) |
| `sponsor` | Sponsor(er) | sponsor-events, motbud, sponsorfavör, jobbet_forsvann | **KÖ om namngiven** (flagga) | Nytt introkort om namngiven |
| `klack_leader` | Namngiven klackledare | — (ej funnen i kod ännu) | **KÖ om existerar** (flagga) | Nytt introkort om röst införs |
| `klack_collective` | Klacken som kollektiv | klackEcho, klackPresenter, klackState/mood | **UNDANTAGEN** | Ambient, ingen person |
| `club_voice` | Klubben (torr institutionsröst) | club.deadpan, Klubbpärmen/liggaren | **UNDANTAGEN** | Institution, ingen man möter |
| `narrator` | Berättaren | SPEC_BERATTAREN | **UNDANTAGEN** | Spelets röst (per dom) |
| `system` | Systemmeddelanden | mekanik | **UNDANTAGEN** | Ej röst |
| `own_player` | Egna spelare | playerConversations, milstolpar | **UNDANTAGEN** | Känd via truppen |
| `nemesis` | Rivalens spelare | InboxItemType nemesis | **UNDANTAGEN** | Subjekt press/klubb beskriver, ej avsändare |

Kommun/förbund lutar undantagna (institutioner, som klubben) tills de förekommer
som en NAMNGIVEN tjänsteman — då flyttas de till kö. Flaggat, ej bråttom.

## Start-vs-kö (förslag att bränna mot i speltest)

- **Start (Tillträdet seedar introducerade):** `assistant_coach`, `board`. De två
  mest frekventa rösterna känns redan vid avspark → portalen står inte tom.
- **Kö (introduceras vid första förekomst, max 1/matchdag):** `local_press` tidigt,
  `patron` när den emergerar (CS ≥ 60, alltså inte direkt), sedan ev. `sponsor`.
- **Kön är kort.** Max 1/matchdag bottnar aldrig — speltestets flod var 3–4
  oidentifierade röster samtidigt, inte tio i kö. Klacken ambient + resten grindad
  löser surret utan en parad av "hej, jag är X".

Jacob mäter i speltest: känns ordningen rätt (journalist före mecenat), och lämnar
Tillträdet spelaren med assistent + ordförande redan kända?

## Flaggor (Codex/Code bekräftar i koden)

1. Är sponsorer namngivna personas? Ja → `sponsor` = KÖ, eget introkort. Abstrakta/
   system → UNDANTAGEN.
2. Finns en namngiven klackledare som egen röst? Ja → `klack_leader` = KÖ. Bara
   kollektiv klack → raden utgår.

## Introkort-copy

- `local_press` (lokalpressens register — presentation KONSTATERAR, första
  egentliga uttalandet nästa matchdag per DOM-regel 1):
  - Titel: `{journalist}, {tidning}.`
  - Body: `{tidning}s man på {ort}. Skriver om {Klubb} — och om det mesta annat som händer här.`
  - `{journalist}`/`{tidning}`/`{ort}` resolvas ur `journalistService`. Slutlig
    skrivs när enum + journalistnamngivning är bekräftade.
  - Förkastad variant: "Du kommer att läsa honom. Ibland gillar du det inte." —
    för ödesmättad, förvarnar om en känslobåge i stället för att konstatera vem.
- `patron`: ingen ny copy — `patron_emerge` är introt.
- `sponsor`/`klack_leader`: skrivs om flaggorna faller ut som KÖ.

## Regel: presentationskort konstaterar, de förvarnar inte

Introkortet etablerar VEM rösten är, inte vad den ska bli. Ödestonen ("kvar när
du är borta", "din tid är kort") är en resurs bara ett fåtal röster får spendera,
sällan, vid rätt tillfälle — styrelsen när tålamodet tryter, inte lokalpressen vid
första mötet. Sprids förgängligheten ut till varje presentation blir hela portalen
dyster på en gång: samma sorts surr röstintroduktionerna skulle bota, fast
känslomässigt i stället för informationsmässigt.

## Handoff

- Code: forma `voiceId`-enumen mot rostern; seed `assistant_coach`+`board` i
  Tillträdet + migrering; bekräfta de två flaggorna.
- Opus: slutlig `local_press`-copy + ev. `sponsor`/`klack_leader`-copy när
  enum/namngivning bekräftad; Jacobs start/kö-kall från speltest låser tabellen.
