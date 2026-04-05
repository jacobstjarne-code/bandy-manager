# Textgranskning — Komplett samling
Datum: 2–5 april 2026
Granskare: Erik

Alla nya svenskspråkiga texter från sprint 2–5 april, sorterade per feature.

---

## Instruktion till Erik

Fyll i "Eriks kommentar"-kolumnen med:
- ✅ (ok)
- ❌ {föreslagen ändring}
- ⚠️ {fråga/tveksamt}

Tänk på:
- Stämmer bandyterminologin? (skridskoåkning, inte löpning)
- Låter det som P4-radio / Bandypuls, inte AI?
- Är ortsnamn och företagsnamn rimliga?
- Är tonen rätt för situationen?
- Språkfel, stavfel, konstiga formuleringar?

---

## 1. EKONOMI — Marknadsvärde-notiser

### roundProcessor.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 1 | "📈 {namn} — marknadsvärde +{X} tkr" | |
| 2 | "📉 {namn} — marknadsvärde -{X} tkr" | |
| 3 | "Nytt värde: {X} tkr (+{Y}%)" | |

### attributeVisibility.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 4 | "~{CA}" (tilde-prefix på estimerade värden) | |
| 5 | "?" (okänd spelare) | |

### TransfersScreen.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 6 | "🔍 Scoutbudget:" (widget-label) | |
| 7 | "Styrka ?" (okänd fri agent) | |

---

## 2. POLITIK — Pronomen + "Bandy för alla"

### politicianEvents.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 8 | "{namn} ringer och vill diskutera kommunens bidrag. {Hon/Han} oroar sig för föreningens ekonomi." | |
| 9 | "{namn} vill att föreningen satsar mer på ungdomar. {Hon/Han} ser positivt på bandyskolan." | |
| 10 | "{namn} vill att kommunen syns med laget. {Hon/Han} ser er som ett varumärke för regionen." | |
| 11 | "{namn} hör av sig diskret. {Hennes/Hans} {systerdotter/brorson} är en ung talang..." | |
| 12 | "Klart, välkommen att prova" | |
| 13 | "🏟️ Förslag från kommunen" (omskriven "Bandy för alla") | |
| 14 | "{namn} har fått bidrag från Allmänna arvsfonden och kontaktar dig." | |
| 15 | "Vi har pengar för integration genom idrott. Ni har plats, ungdomar och en förening som folk litar på. Kan ni ta emot en grupp på 10–15 ungdomar två kvällar i veckan?" | |
| 16 | "Starta programmet" | |
| 17 | "💛 +5 fanMood · ⭐ +3 communityStanding · 💰 +6 000 kr/sä kommunbidrag" | |
| 18 | "Föreslå ungdomsgrupp istället — kommunen driver" | |
| 19 | "⭐ +1 communityStanding · ingen kostnad" | |
| 20 | "Tacka nej — vi har inte kapacitet" | |
| 21 | "🤝 -5 relation med {namn}" | |
| 22 | "Inkluderingsprogrammet har kommit igång. {namn} tackar för samarbetet." (followUp) | |

---

## 3. DUBBELLIV — Jobbkonflikt + Spelarröst

### eventFactories.ts — Jobbkonflikt (befintlig, nu med subtitles)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 23 | "Ge honom vila" — "😊 +10 morale" | |
| 24 | "Han klarar det" — "😊 -3 morale · risk för skada" | |
| 25 | "Erbjud heltidskontrakt (lön ×1.5)" — "💰 +{X} tkr/mån · 😊 +15 morale · ⭐ bättre träningseffekt" | |

### eventFactories.ts — Spelarröst (nya events)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 26 | "📰 {namn} till {journalist}: 'Jag vill spela'" | |
| 27 | "Jag tränar varje dag och gör mitt bästa. Men jag sitter bara på bänken. Det är klart att jag funderar på min framtid." | |
| 28 | "Prata med spelaren privat" | |
| 29 | "Konfrontera honom om att gå till media" | |
| 30 | "Ignorera — det blåser över" | |
| 31 | "📰 {namn1} om {namn2}: 'Bästa jag spelat med'" | |
| 32 | "Vi har en förståelse på planen som inte kräver ord. {namn2} vet alltid var jag vill ha bollen." | |
| 33 | "📣 Kaptenen tar ton i omklädningsrummet" | |
| 34 | "Det räcker nu. Vi är bättre än det här. Varenda en av er vet det. Imorgon börjar vi om." | |

### eventFactories.ts — Befordran

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 35 | "{namn} erbjuds befordran" | |
| 36 | "{namn} har erbjudits en befordran som {jobbtitel}. Det innebär mer ansvar, bättre lön — men sämre flexibilitet för bandy." | |
| 37 | "Uppmuntra honom — jobbet går först" | |
| 38 | "Be honom tacka nej — bandyn behöver honom" | |

### eventFactories.ts — Schemakrock

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 39 | "Schemakrock för {namn}" | |
| 40 | "{namn} har ett obligatoriskt möte på {jobb} samma dag som nästa match. Han kan inte vara med på uppvärmningen." | |
| 41 | "OK — han ansluter direkt till match" | |
| 42 | "Sätt honom på bänken istället" | |

### eventFactories.ts — Arbetskamrater

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 43 | "Arbetskamrater på {arbetsgivare}" | |
| 44 | "{namn1} och {namn2} jobbar båda på {arbetsgivare}. De pendlar tillsammans och har börjat träna extra på lunchen. Kemin på planen har blivit bättre." | |

### eventFactories.ts — Varsel

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 45 | "Varsel på {arbetsgivare}" | |
| 46 | "{arbetsgivare} har meddelat varsel. {X} spelare i truppen berörs: {namn}. De riskerar att förlora jobbet — och kanske behöva flytta." | |
| 47 | "Stöd spelarna — erbjud extra träning och stöd" — "😊 +5 morale alla · 🤝 laget håller ihop" | |
| 48 | "Erbjud heltidskontrakt åt alla (lönekostnad ×1.5)" — "💰 höjd lönekostnad · 😊 +15 morale · ⭐ storyline" | |
| 49 | "Det är tråkigt, men inte vårt problem" — "😊 -8 morale · risk att spelare lämnar" | |
| 50 | "Situationen efter varslet på {arbetsgivare} har stabiliserats. Spelarna har hittat nya lösningar." (followUp) | |

---

## 4. ARBETSGIVARE — Ortsnamn

### localEmployers.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 51 | Sandviken: "Sandvik AB" / "Gästrike Vatten" / "Göransson Arena" | |
| 52 | Edsbyn: "Edsbyns Elverk" / "Träslöjden Edsbyn" | |
| 53 | Västerås: "ABB" / "Västerås stad" | |
| 54 | Uppsala: "Uppsala kommun" / "Uppsala universitet" | |
| 55 | Söderhamn: "BillerudKorsnäs" / "Söderhamns kommun" | |
| 56 | Falun: "SSAB Borlänge" / "Falu kommun" | |
| 57 | Fallback: "Lokala bruket" / "Kommunen" | |

---

## 5. MEDIA — Journalist + Press

### journalistService.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 58 | "{namn} i {tidning}: " (supportive, positiv rubrik) | |
| 59 | "{tidning} — analys: " (analytical) | |
| 60 | "{tidning}: SENSATION! " (sensationalist, positiv) | |
| 61 | "{tidning}: KRIS! " (sensationalist, negativ) | |
| 62 | "{tidning} — granskning: " (analytical, negativ) | |

### Journalist-namn (genererade vid spelstart)

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 63 | Förnamn: Anna, Erik, Karin, Lars, Maria, Peter, Sofia, Johan, Lena, Magnus, Helena, Nils, Camilla, Anders | |
| 64 | Efternamn: Lindqvist, Bergström, Holmgren, Sandberg, Nordin, Wikström, Eklund, Hedlund, Gustafsson, Johansson | |

### pressConferenceService.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 65 | "Vägra presskonferens" (val-text) | |
| 66 | "Tränaren vägrade kommentera efter matchen. Det skickar en signal." | |

### pressConferenceService.ts — Storyline-medvetna frågor

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 67 | "Ingen trodde på er i augusti. Nu leder ni serien. Vad säger du till tvivlarna?" | |
| 68 | "Kaptenen tog ton i omklädningsrummet förra veckan. Har det gett effekt?" | |
| 69 | "Varslet drabbade era spelare hårt. Hur har klubben hanterat situationen?" | |
| 70 | "{namn} slutade jobbet för att satsa på bandyn. Har det betalat sig?" | |

---

## 6. STORYLINES — Händelseminne

### eventResolver.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 71 | "{namn} slutade som {jobb} för att satsa heltid på bandyn" (went_fulltime_pro) | |
| 72 | "Kaptenen samlade laget efter en svår period" (captain_rallied_team) | |
| 73 | "Klubben räddade spelare från uppsägning genom att erbjuda heltidskontrakt" (rescued) | |

### seasonSummaryService.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 74 | "{X} spelare blev heltidsproffs — ett modigt steg." | |
| 75 | "Klubben höll ihop trots varslet." | |
| 76 | "Kaptenen samlade laget i en svår period." | |

---

## 7. LEGACY — Pensionering

### seasonEndProcessor.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 77 | "🎖️ {namn} — en legend tackar för sig" | |
| 78 | "{X} säsonger, {Y} mål. '{storyline}' Fansen: 'Tack för allt!'" | |
| 79 | "En spelare som betydde mycket." (fallback) | |

---

## 8. BANDYGALAN

### bandyGalaService.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 80 | "🏆 Bandygalan" | |
| 81 | "Bandygalan {år} — årets prisutdelning!" | |
| 82 | "{klubb} har {X} pristagare!" | |
| 83 | "Gå på galan — visa upp klubben" | |
| 84 | "⭐ +3 reputation · 💛 +5 fanMood" | |
| 85 | "Skippa — fokusera på träning" | |
| 86 | "🏆 {namn} vann {pris}!" (inbox) | |
| 87 | "{namn} vann {pris} på Bandygalan {år}" (storyline) | |
| 88 | Priser: "Årets spelare", "Årets forward", "Årets målvakt", "Årets nykomling", "Årets veteran" | |

---

## 9. EVENT-KVALITET — Sponsor-inbox

### eventResolver.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 89 | "🤝 Nytt sponsoravtal: {namn}" | |
| 90 | "{namn} har tecknat avtal. +{X} kr/omgång i {Y} omgångar." | |
| 91 | "📬 Uppföljning" (generisk followUp-titel) | |

---

## 10. TRANSFERMARKNAD

### TransfersScreen.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 92 | "🏪 Marknad" (tab-label) | |
| 93 | "Inga spelare tillgängliga på marknaden just nu." | |
| 94 | "📋 Kontrakt går ut — Kan värvas gratis efter säsongen. Förhandling möjlig nu." | |
| 95 | "😤 Missnöjda — Spelare som vill byta miljö. Kräver transferbud." | |
| 96 | "🔻 Övertaliga — Klubben har för många på positionen. Kan sälja billigt." | |
| 97 | "💰 Ekonomiska skäl — Klubben behöver sälja. Pruta hårt." | |
| 98 | "⭐ Fynd" (markering) | |
| 99 | "🔥 {X} klubbar intresserade" (värvningsrykte) | |

---

## 11. NARRATIV ARC — Dashboard

### DashboardScreen.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 100 | "☀️ Allt stämmer just nu" (honeymoon) | |
| 101 | "⛅ Media ställer frågor" (questioned) | |
| 102 | "⛈️ Styrelsen är orolig" (crisis) | |
| 103 | "🌤️ Vändningen har börjat" (redemption) | |
| 104 | "👑 Legendstatus" (legendary) | |

---

## 12. TRÄNING — Jobbpåverkan

### TrainingSection.tsx

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 105 | "👷 Jobbpåverkan" | |
| 106 | "{X} heltidsproffs (full träningseffekt) · {Y} deltidsspelare" | |
| 107 | "(snitt flex {X}%)" | |
| 108 | "⚠️ Låg flexibilitet — deltidsspelare får sämre träningseffekt" | |

---

## 13. SINGULAR/PLURAL

### roundProcessor.ts

| # | Text | Eriks kommentar |
|---|------|-----------------|
| 109 | "Skicka honom" (1 spelare) / "Skicka dem" (2+) | |

---

**Totalt: 109 texter att granska.**

Returnera filen till Jacob.
