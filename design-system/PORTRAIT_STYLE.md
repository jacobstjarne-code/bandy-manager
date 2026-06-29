# PORTRAIT_STYLE — spelarporträtt (pool-modell)

**Författare:** Opus + Jacob · **Etablerad:** 2026-06-23/24 · **Status:** Stil låst (tre testporträtt godkända). Pool ej producerad än. Wiring är ett Code-jobb.

## Beslut: fast pool, inte bespoke per spelare

Spelet har hundratals spelare och ett dynamiskt roster (köp, ungdomar upp, veteraner slutar). Bespoke-porträtt per spelare går inte — och de nuvarande `svgPortraitService`-avatarerna (cirklar/rektanglar) är för grova att bygga vidare på. Lösning: en **fast pool på ~30 porträtt per åldersfack** (ung / medel / äldre), som slumpas till spelare vid spelstart.

Regler för poolen:
- **Trupp-unik tilldelning.** Samma ansikte får inte återkomma i en trupp man ser samtidigt (~18 spelare). Återbruk mellan olika lag är OK (ingen märker det). Därför ~30 per fack, inte 20.
- **Ansiktet tilldelas EN gång** vid spelarens skapande, ur rätt åldersfack, och sitter sedan statiskt. Acceptera visst åldersglapp över en lång karriär — att byta ansikte vid en åldersgräns blir skumt.
- **Ny dragning för köpta/uppflyttade spelare.**

## Stil (låst)

Platt grafisk / mid-century screentryck / retro sportprogram: djärva platta former, minimala konturer, begränsad dämpad palett, lätt korn. Vädrad arbetarklass-atletblick, inte glamorös. Naturlig hudton som den enda värmen. Stilen rimmar med scenerna och märkena.

**KIT-NEUTRAL — kritiskt.** Enkel slät tröja i neutral grå, ABSOLUT inget klubbmärke, ingen logga, inget ankare, ingen krage, inget emblem på bröstet. Klubbtillhörighet sköts av märket på kortet — annars visar en köpt spelare fel klubbs färger. (Detta tog flera försök att få Nano att lyda; tröjan ärvdes från referensbilder.)

## Output-format (verifierat mot PlayerCard.tsx)

UI-ytan är RUND: porträttet renderas i en `64×64`-cirkel (`borderRadius:50%`, `overflow:hidden`, `objectFit:cover`), samma bild skalas ner i små pillen/listor.

- Generera **kvadratiskt (1:1)**, aldrig runt. Cirkeln görs av CSS; en rund bild ger fula gap.
- **Opak svala-grå bakgrund**, INTE transparent. Hörnen klipps av cirkeln ändå; enhetlig grå ger poolen sammanhållning; Nano är ostadig på transparens.
- **Ansiktet centrerat med rejäl marginal** över hår och under haka — `objectFit:cover` på en cirkel beskär hårt och kapar annars hjässa/haka.
- **En högupplöst master per porträtt** räcker; UI:t skalar och maskar.

## Arbetssätt: kuraterad spridning, en i taget

Generera en i taget (inte en lista) så spridningen kan styras aktivt. Nano driver mot nordisk default — bad om mellanöstern-30, fick rödhårig svensk. En lista blir därför 90 variationer av samma ansikte. Opus för register över vad poolen har och beskriver för varje nästa porträtt en specifik person som fyller en lucka.

Variationsaxlar: ålder och HUR den syns (tidig flint, ungdomlig 30-åring, väderbiten 22-åring), hudton/etnicitet (homogen men inte enfärgad), ansiktsform, hår, skägg, glasögon, ärr, bruten näsa, öron, käke — och TYPEN (teknikern, slitvargen, juniorens nervösa blick, veteranens trötta lugn).

**Konstant genom hela poolen:** stil, ljussättning, beskärning, grå bakgrund. Bara människan varierar. Det skiljer varierad pool från rörig pool.

## Arbetsprompt

> Flat graphic stylized portrait of a Swedish bandy player [ÅLDER + ETNICITET/DRAG — tvinga explicit], head and shoulders, front view, centered, with generous margin above the hair and below the chin so a circular crop won't clip the head. Plain simple crew-neck top in flat neutral grey — ABSOLUTELY NO crest, no logo, no anchor, no collar, no emblem, completely plain chest. Mid-century screenprint / retro sports-program style: bold flat shapes, minimal outlines, limited muted palette, subtle grain. Plain cold slate-grey background filling the frame. Natural skin tone as the one warmth. No text. Square 1:1 portrait crop.

Om referensbild används: lägg till "ignore and remove any jersey, crest or anchor from the reference."

## Register — vad poolen har hittills (3 testporträtt)

1. Medel (~28–32), nordisk, mörkt hår, skäggstubb. (Bar Söderfors-tröja — testbild, kassera eller kör om kit-neutral.)
2. Medel (~30), nordisk, mörkt hår — snarlik #1. (Ankartröja — testbild.)
3. Ung (~18–20), rödhårig, fräknig, ljushyad. Kit-neutral OK.

**Poolen saknar:** mörkhyad/utomnordisk (tvinga hårt), äldre fack (~34, grått/tunnande, rynkor), och mer avstånd mellan medel-ansiktena. Första riktiga produktionsporträtten bör fylla dessa.

## Nästa steg

1. Producera poolen fack för fack, kuraterat (Opus för register, beskriver varje nästa person).
2. När facken är fulla: Code-jobb — skriv om `getPortraitImagePath`/`svgPortraitService` till pool-dragning med trupp-unik tilldelning och ny dragning för köpta/uppflyttade.
