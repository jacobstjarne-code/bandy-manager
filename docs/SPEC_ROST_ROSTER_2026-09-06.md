# SPEC_ROST_ROSTER — kanonisk voiceId-roster + start/kö/undantag

**2026-09-06 · Opus · parar `DOM_ROSTINTRODUKTIONER_2026-09-06.md` · Opus-handoff-halvan**

Rosten över namngivna återkommande röster som röstintro-grinden gäller, med
klass per röst. Grundad i kod (portalBuilder/inboxToPortal/patronData/journalist-
service), inte gissad. **Status: start/kö-FÖRSLAG väntar Jacobs kall i speltest. Kod-flaggorna besvarade
(Codex 2026-09-06): sponsor undantagen (bolag utan talesperson), klackledare
bekräftad som kö-röst (namngiven person).**

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
| `sponsor` | Sponsor(er) | sponsor-events, motbud, sponsorfavör, jobbet_forsvann | **UNDANTAGEN** (Codex: bolag utan namngiven talesperson) | — |
| `klack_leader` | Namngiven klackledare | namngiven person i kod; wirad (Codex producentpass) | **KÖ** | Nytt introkort (Opus-copy) |
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
  `patron` när den emergerar (CS ≥ 60, alltså inte direkt), och `klack_leader` (wirad).
  `sponsor` är undantagen (bolag utan talesperson).
- **Kön är kort.** Max 1/matchdag bottnar aldrig — speltestets flod var 3–4
  oidentifierade röster samtidigt, inte tio i kö. Klacken ambient + resten grindad
  löser surret utan en parad av "hej, jag är X".

Jacob mäter i speltest: känns ordningen rätt (journalist före mecenat), och lämnar
Tillträdet spelaren med assistent + ordförande redan kända?

## Kod-svar (Codex 2026-09-06)

1. Sponsor: bolag utan namngiven talesperson → **UNDANTAGEN**.
2. Klackledare: namngiven person → **KÖ**; wirad (Codex producentpass); introkort-copy nedan.

## Introkort-copy

- `local_press` (lokalpressens register — presentation KONSTATERAR, första
  egentliga uttalandet nästa matchdag per DOM-regel 1). Könsneutral:
  journalistpoolen innehåller både kvinnor och män (Codex-fynd 2026-09-06).
  **LÅST 2026-09-06 (Jacobs val, kandidat 1):**
  - Titel: `{journalist}, {tidning}.`
  - Body: `Bevakar {Klubb} — matcher, beslut, det som sägs i kön på Konsum. Var på plats före dig, och blir kvar efter.`
  - `{journalist}`/`{tidning}` resolvas ur `journalistService`. Codex byter fallback
    "reporter" mot detta.
  - Förkastade: "Du kommer att läsa honom. Ibland gillar du det inte." (ödesmättad,
    förvarnar); "{tidning}s man på {ort}" (könar rösten); kandidat 2 "Bevakar {Klubb},
    och det mesta annat som händer i {ort}" (torrare, valdes bort).
- `patron`: ingen ny copy — `patron_emerge` är introt.
- `klack_leader` (klackens register genom en person — jordnära, direkt, sparsam,
  könsneutral; presentation KONSTATERAR):
  - Titel: `{klackledare}.`
  - Body: `Håller ihop {klubb}s klack — sångerna, resorna, ståplatsen bakom kortsidan. Talar för dem som står där varje match.`
  - `{klackledare}`/`{klubb}` resolvas ur klack-producenten. Könsneutral av samma
    skäl som lokalpressen — kolla att klack-poolen inte är enkönad innan lås.
- `sponsor`: ingen copy — undantagen.

## Regel: presentationskort konstaterar, de förvarnar inte

Introkortet etablerar VEM rösten är, inte vad den ska bli. Ödestonen ("kvar när
du är borta", "din tid är kort") är en resurs bara ett fåtal röster får spendera,
sällan, vid rätt tillfälle — styrelsen när tålamodet tryter, inte lokalpressen vid
första mötet. Sprids förgängligheten ut till varje presentation blir hela portalen
dyster på en gång: samma sorts surr röstintroduktionerna skulle bota, fast
känslomässigt i stället för informationsmässigt.

## Handoff

- Code/Codex: `voiceId`-enum + grind + seed + migrering byggt i `e8a22926`;
  patronens uppskjutning och save-migrering färdig i `6970dd1a`; `local_press` och
  `klack_leader` med låst intro-copy och producentwiring färdiga i `3cc76b6e`.
  Det finns alltså inget kvarvarande Code-gap i rosterimplementeringen.
- Opus: `klack_leader`-copy och `local_press` kandidat 1 är låsta och konsumerade.
  Kvar är Jacobs speltestdom om start/kö-ordningen — den är en upplevelsefråga,
  inte ett oimplementerat kort.
