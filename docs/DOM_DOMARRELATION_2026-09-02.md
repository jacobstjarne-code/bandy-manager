# DOM — DOMARRELATIONEN: ge den roll + mekanik (nivå 3)

**Datum:** 2026-09-02 · **Av:** Opus + Jacob · **Utlöst av:** Codex liggar-inventering — domarrelationen är "levande men rollös": efter varje match sparas antal matcher/kort/straffar/säsong/`clubReaction` (respekt/neutral/protest, ett SPELARVAL), men bara `lastMatchRound` används (undvik samma domare för tätt). Resten påverkar ingenting. B12-klassen i stor skala: ett helt relations-state utan konsument. Erkänt i `contentContract.ts:515`, sparas i `refereeService.ts:144`.

## Beslutet — NIVÅ 3: roll + mekanik (Jacob 2026-09-02)
`clubReaction` är ett spelarval — du väljer hur laget bemöter domaren. Att spara ett val och ignorera det är promise↔consequence-brottet vi jagat överallt. Domen: **valet blir sant på riktigt — det påverkar domarens attityd, som marginellt påverkar domslut, och fejden minns via liggaren.** Inte reducera (nivå 1), inte bara synlig historik (nivå 2) — full roll.

## Mekaniken

### 1. clubReaction ackumuleras till en domar-attityd mot din klubb
Per domare, per klubb: protestera ofta → attityden sjunker; visa respekt → neutral till svagt positiv. En ackumulerad siffra (samma mönster som andra relations-state), skriven vid varje möte.

### 2. Attityden påverkar domslut MARGINELLT (matchmotor-vakten är kritisk)
En sur domare ger marginellt fler kort/straffar mot dig; en välvillig marginellt färre. **VAKT — läs detta som en gräns, inte en detalj:** effekten ska vara KÄNNBAR men LITEN. En domare får ALDRIG avgöra en match ensam. Målet är att en spelare ska MÄRKA "den här domaren gillar oss inte" över tid, inte förlora en match på ett domslut. Magnitud via mätning, men taket är hårt: attityden får skifta odds i marginalen, aldrig vara utslagsgivande. En domare som känns riggad mot dig är frustration, inte en båge — skillnaden är att en BÅGE är subtil och ackumulerad, en RIGG är ett enskilt avgörande domslut. Bygg bågen, inte riggen.

### 3. Fejden minns via liggaren (steg 2-3-båge)
En domare du byggt en riktig relation med — fejd eller förtroende — är en nemesis-liknande båge. När attityden korsar en tröskel (blir en genuin fejd, eller en läkt relation), skriv en liggarpost. `EventLedgerType` har ingen domar-typ än → **ny typ `referee_feud` / `referee_relationship` (Code: stanna+flagga om osäker, men det är en deklarerad utökning per schema-mönstret)**, subject = domaren (kräver `subject.kind: 'referee'` — samma utökning som patron fick, eller återanvänd en generisk person-kind om en sådan finns). Då kan årsboken/historiken bära "tredje gången {domare} dömde mot oss i ett avgörande läge" — samma callback-princip som burnout/press-återfallen.

## SKYDDAT
- **Matchmotorn: marginellt, aldrig utslagsgivande.** Detta är den enda verkliga risken. En domar-attityd som avgör matcher gör spelet orättvist, inte djupt. Bågen är att MÄRKA en relation över tid, inte att förlora på ett domslut. Mät magnituden konservativt, taket hårt.
- **clubReaction-valet blir sant** — det är hela poängen: ett val vi ber om ska betyda något. Reducera det INTE.
- **Liggaren, inte en egen ficka** — domar-fejden skrivs till kanon (liggare-inventeringens princip), så den minns över säsonger utan att bli en förliggare.
- **`lastMatchRound`-användningen (undvik samma domare för tätt) är orörd** — den fungerar, den är cooldown, den stannar.

## GODKÄNT NÄR (mät + playtest)
1. Protestera upprepat mot en domare → märkbart (men litet) fler kort/straffar mot dig över flera möten.
2. En domare avgör ALDRIG en match ensam — attityden skiftar odds i marginalen, aldrig utslaget.
3. En genuin domar-fejd/förtroende når liggaren → syns i årsbok/historik med callback ("tredje gången...").
4. clubReaction-valet känns sant — spelaren märker att det bemötande de valde fick konsekvens.
5. Playtest: känns en sur domare som en NEMESIS (subtil, ackumulerad) eller en RIGG (orättvis, enskild)? Det förra = klart, det senare = sänk magnituden.

## OPUS-TEXT (skriven mot mönstret 2026-09-02, redo att wiras)

Samma form som `BURNOUT_MARK_RELAPSE` / pressbågens återfallsrader: första gången etablerar, återfallet KÄNNER IGEN. `{domare}` = domarens namn/efternamn, uppslaget ur subject. Två riktningar (fejd/förtroende), två nivåer (första/återkommande).

**FEJD — relationen surnar:**
- Första gången (tröskeln korsas neråt): "Det börjar bli något mellan er och {domare}. Protesterna sitter kvar, och det märks i besluten."
- Återkommande (fejden djupnar): "{domare} igen. Ni känner igen visselpipan nu — och den känner igen er. Det där slutar inte av sig självt."

**FÖRTROENDE — relationen värms:**
- Första gången (tröskeln korsas uppåt): "Ni har börjat få med er {domare}. Respekten lönar sig — tveksamheterna faller lite oftare åt ert håll."
- Återkommande (förtroendet består): "{domare} dömer er rättvist, och det är inte inget. Över tid har ni byggt något de flesta lag aldrig får — en domare som lyssnar."

Callback-principen: återfallsraderna VET att det hänt förr ("igen", "över tid", "känner igen"), samma som burnout/press. Understatement, bandysvenska, ingen melodram — en domarrelation är smållänkt, inte operatisk. **Placeringsdom (Opus, när strukturen står):** sannolikt årsboken/historiken (där bågen minns) + ev. en rad inför en match mot en domare med stark relation — avgörs mot Code:s wiring.

## ÄGARSKAP
Code: (1) ackumulera clubReaction → domar-attityd per klubb, (2) marginell domslut-effekt med HÅRT tak (mät konservativt), (3) `referee_feud`-liggartyp + subject-kind, skriv vid tröskelkorsning. Opus: fejd-/förtroende-texten (callback-rader när relationen minns, samma som burnout-återfallet) + placeringsdom (årsbok? match-inför?) när strukturen står. Jacob: magnitud-tuning efter mätning (hur mycket attityden skiftar odds) — känslo-kall, och den avgör nemesis-vs-rigg.
