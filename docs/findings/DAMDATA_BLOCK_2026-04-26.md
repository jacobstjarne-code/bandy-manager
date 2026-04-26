# Damdata-blockad — 2026-04-26

## Identifiering

Klassificerare körd mot alla 208 Q-facts med nyckelord:
`dambandy`, `damserien`, `damelitserien`, `dameliten`, `damernas`, `damlag`, `dam-`, ` dam `, `damserie`, `damdata`

**Antal funna: 31 Q-IDn**

## Lista av blockerade Q-IDn

| Q-ID | Claim |
|------|-------|
| Q021 | Varför är hörneffektiviteten lägre i damserien — teknik, taktik, eller slump? |
| Q022 | Är lagstyrke-spridningen faktiskt större i damserien? |
| Q023 | Skiljer sig målminutsfördelningen (Finding 005) mellan dam och herr? |
| Q029 | Syns samma inverterade mönster i dambandy med liknande marginaluppdelning? |
| Q043 | Varierar hörneffektiviteten mellan olika lag i damserien, eller är skillnaden mot herrserien jämnt fördelad? |
| Q045 | Har hörneffektiviteten i damserien förändrats över säsonger, eller är nivån stabil? |
| Q046 | Via vilka typer av aktioner skapas de mål i damserien som inte härrör från hörnor? |
| Q049 | Skiljer sig målminutsfördelningen mellan olika divisioner inom herr- respektive damserien? |
| Q050 | Påverkar hemma/borta-faktorn när under matchen mål görs, och är den effekten likartad i dam och herr? |
| Q057 | Finns samma mönster i damserien, eller är hemma/borta-effekten annorlunda där? |
| Q062 | Hur ser motsvarande siffror ut i damserien? |
| Q078 | Skiljer sig andelen täta matcher åt mellan dam- och herrbandy, och påverkar det jämförbarheten? |
| Q082 | Finns målminutdata för damseriens matcher i samma format som herrseriens? |
| Q083 | Är målfrekvensen per match i damserien tillräckligt hög för att tiominutersintervall ska ge stabila skattningar? |
| Q084 | Skiljer sig andelen jämna kontra öppna matcher strukturellt mellan herr- och damserien? |
| Q085 | Skulle en grövre uppdelning (t.ex. tre perioder om 30 minuter) ge stabilare skattningar för damserien? |
| Q086 | Finns tidsserieskillnader inom damserien som kan störa en poolad analys? |
| Q090 | Skiljer sig mellankategorins distribution åt mellan dambandy och herrbandy? |
| Q096 | Finns tidsstämplade måldata från damelitserien i bandy, och i så fall i vilket format? |
| Q097 | Uppvisar dambandy samma sluttryck som herrbandy när korrekt data finns tillgänglig? |
| Q098 | Skiljer sig målminutsfördelningen åt mellan olika nivåer inom dambandy (elitserie vs. division 1)? |
| Q099 | Går det att kombinera dam- och herrdata för att testa om sluttryck är ett generellt bandyfenomen oberoende av serie? |
| Q118 | Finns hörnstatistik registrerad för damserien överhuvudtaget, och i så fall från vilka säsonger? |
| Q120 | Skiljer sig datakvaliteten åt mellan dam- och herrserien vad gäller registrering av dödbollar? |
| Q124 | Skiljer sig fördelningen av aktionstyper åt mellan dam- och herrserien om data samlas in? |
| Q125 | Hur stor andel av alla mål i damserien härrör överhuvudtaget inte från hörnor? |
| Q135 | Hur ser motsvarande mönster ut i dambandy — är slutminutstoppen lika stark och drivs den av samma faktorer? |
| Q159 | Stämmer samma mönster för dambandy, eller är hemma/borta-skillnaden annorlunda i det seriesystemet? |
| Q173 | Ser damernas serie ut på samma sätt, eller är hemmafördelen vid halvtidsledning ett renodlat herrmönster? |
| Q183 | Hur ser mönstret ut i damserie — reducerar lag där lika tidigt eller sker comebacks annorlunda? |
| Q194 | Är klustringen i 91–100 lika stark i damserien, eller är det ett herr-specifikt mönster? |

## Åtgärd

Alla 31 Qn uppdaterade till:
```yaml
status: closed
closed_at: 2026-04-26
closed_reason: data_unavailable
data_required: damdata
unblocks_when: "Damelitserien skrapad"
```

## Återöppning

När Damelitserien-data finns tillgänglig (bandygrytan.se eller annan källa):
1. Kör grep på `unblocks_when: "Damelitserien skrapad"` för att hitta alla blockerade Qn
2. Ändra status till `open` och ta bort `closed_*`-fälten
3. Kör findings-pipelinen mot damdata
