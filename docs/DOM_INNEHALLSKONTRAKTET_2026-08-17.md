# INNEHÅLLSKONTRAKTET

**Datum:** 2026-08-17 · **Av:** Opus · **Post:** O11 i `SLUTTEST_KO.md`
**Gäller från nu.** Ingen berättelsetext wiras utan att kontraktet är uppfyllt.

---

## Varför

Fem gånger i den här serien har en yta lovat något domänen inte täckte:

| Fall | Löfte | Faktisk effekt |
|---|---|---|
| Prototypen | "Hela slingan finns redan i koden" | Noll beslutstyper kopplade till ripple |
| `ArrivalScene:74` | "Tre kontrakt löper ut" | Inga kontrakt gick ut |
| "Ge honom vila" | Spelaren vilar | `boostMorale +10`, spelade nästa match |
| Varselvalet | "Risk att spelare lämnar" | `boostMorale`, ingen lämnade |
| Mecenaten | "Lämnar permanent" | `mecenatHappiness` kunde väcka den |

Plus fyra kompletta no-ops som `2.5` hittade: effektblock utan `targetPlayerId`, en `multiEffect`-gren som saknades helt. Och en falsk storyline skriven om ett laget-samlades-ögonblick som aldrig inträffade.

Mönstret är inte slarv. Det är att **text kan skrivas utan att någon behöver deklarera vad den betyder mekaniskt.** Kontraktet stänger det.

---

## Kontraktet — sex fält, alla obligatoriska

Ingen ny berättelsetext wiras utan att dessa sex är ifyllda och verifierade.

### 1 · Trigger
Exakt villkor som får händelsen att uppstå. Inte "när klubben går dåligt" utan det fält och den tröskel som läses.

### 2 · State-effekt
Vilka fält som faktiskt ändras, med riktning och storleksordning. **Om svaret är "ingen" är det inte en händelse, det är en notis** — och den ska renderas som ambient (`D1`), inte som ett beslut.

### 3 · Berörda system och personer
Vilka av spelets system utfallet rör. En systemhändelse enligt varsel-mallen kräver minst två som pekar isär; en vanlig händelse kräver minst ett.

Om en person nämns vid namn: `playerId` eller motsvarande referens, inte en sträng. Namn i text utan referens är hur `{motståndare}` uppstod.

### 4 · Livslängd
Hur länge effekten lever. Engångs, N omgångar, till säsongsslut, permanent.

**"Permanent" kräver ett fält som gör det omöjligt att ändra** — `permanentlyWithdrawn`-mönstret från `K5`. Ordet räcker inte.

### 5 · `semanticKey` och cooldown
Vilken narrativ båge händelsen tillhör, och hur länge samma båge inte får återkomma.

Nyckeln är per **båge**, inte per säsong. `playoff_final_2031` och `playoff_final_2032` är samma nyckel. Det var det som lät "Finalen. Birger…" komma ordagrant fem år i rad.

### 6 · Återkallningsyta
Var spelaren kan se att detta hände, efteråt. Granska, årsboken, Historik, inbox — eller uttryckligen ingen, vilket är ett giltigt svar för ambient.

**En pivotal händelse utan återkallningsyta är ett minne spelet glömmer.**

---

## Regler som följer av kontraktet

**Effekt och storyline skrivs i samma operation.** Misslyckas effekten skrivs ingen storyline. Redan byggt för `captainSpeech` och varsel-`offer_pro` (`fdcf55cb`, `441c4474`) — regeln gäller nu generellt.

**Resolvern kastar på ofullständigt effektblock.** Redan byggt, 25 kontroller (`ed94218f`). Ett tyst `skip` är det som gjorde fyra no-ops osynliga.

**Färdig text utan yta bevaras men wiras inte.** Att en pool är skriven är inget skäl att koppla in den. Lägg den i `docs/` med kontraktet ifyllt så långt det går, och notera vad som saknas.

**Kontraktet gäller ändringar, inte bara nya händelser.** Ändrar någon en befintlig händelses text så att den lovar mer — nytt kontrakt.

---

## Var kontraktet bor

En rad per händelse i en maskinläsbar tabell, inte i prosa. Kolumner = de sex fälten.

**Rapportera innan detta byggs:** finns redan ett register över event-typer som tabellen kan hänga på (`eventFactories`, en katalog, en enum), eller måste den skapas? Om den måste skapas är det samma arbete som `U5`:s `semanticKey`-kartläggning — gör dem tillsammans, inte två gånger.

---

## Godkänd när

En ny berättelsetext kan inte nå produktion utan att de sex fälten är ifyllda, och `2.5`:s throw-guard-instrument (`scripts/eventGuardInstrument.ts`) körs som del av grinden.

Kontraktet är inte ett dokument någon ska minnas. Det är en fil som failar bygget.
