# Bugfix Sprint 3

## 1. Ekonomin fortfarande alldeles för generös
15.9 mkr i kassan efter 1 säsong, +754 tkr per omgång. Realistiskt: 200-600 tkr total kassa.

### worldGenerator.ts
Sänk startfinanser:
```
finances: Math.round((reputation * 4000 + 50000 + rand() * 80000) / 10000) * 10000
```

### roundProcessor.ts — calculateMatchRevenue  
- `arenaCapacity`: ändra från `reputation * 80 + 2000` till `reputation * 25 + 600`
  Ger 1350 (rep 30) till 2850 (rep 90)
- `ticketPrice`: ändra från `80 + reputation * 0.8` till `60 + reputation * 0.4`
  Ger 72-96 kr
- Community income: halvera alla värden (kiosk, VIP, funktionärer etc)

### roundProcessor.ts — weeklySponsorship (basintäkt)
- Ändra `reputation * 250` till `reputation * 60`
  Ger 1800-5400/omg istället för 7500-22500

### sponsorService.ts — sponsorintäkter
- `weeklyIncome`: max 500-2000 per sponsor, inte 3000-5000

### createNewGame.ts
- `transferBudget`: sänk till `Math.round((reputation * 1000 + rand() * 20000) / 5000) * 5000`
- `wageBudget`: verifiera att den är rimlig (50-150 tkr/mån)

### Målbild
- Matchintäkt hemma: 30-80 tkr
- Lönekostnader: 30-100 tkr/omgång
- Netto per omgång: ±10-30 tkr (tight!)
- Efter 22 omgångar: 200-600 tkr total kassa

## 2. Form-färger (V/O/F) på Dashboard
I LastResultCard.tsx eller DashboardScreen.tsx, senaste formrutorna visar fel färger:
- V (vinst) ska vara GRÖN (var(--success))
- F (förlust) ska vara RÖD (var(--danger))  
- O (oavgjort) ska vara GRÅ (var(--text-muted))

Sök efter `recentForm` rendering och kontrollera färgmappningen.

## 3. Dashboard playoff-serie visar fel vinster
I getSeriesScore eller NextMatchCard visas fel antal vinster. Kontrollera att:
- managed club's wins mappas korrekt baserat på om managedClubId === series.homeClubId
- Visa MANAGED wins vs OPPONENT wins, inte home vs away

## Redan fixat (i denna commit):
- ✅ Dubbla headers på RoundSummary och BoardMeeting (GameHeader borttagen)
- ✅ Hörnspecialist decimaler (Math.round)
- ✅ Styrelsens bedömning: ChallengeTop threshold 3→5, WinLeague 1→2
- ✅ ChampionScreen: rätt ikon/titel per slutspelsresultat (🥈 finalist, 🏅 semifinal, 🏋️ kvarts)

Kör npm run build, committa, pusha.
