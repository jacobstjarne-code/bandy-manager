# Sprint TS-1 Pass 2 — audit

## Punkter i spec

- [x] 2A: `applyCaptainMoraleCascade` extraherad till `playerStateProcessor.ts`, anropas från roundProcessor på samma position
- [x] 2B: `executeAcceptedTransfers` extraherad till `transferProcessor.ts` med ren input/output-interface
- [x] 2C: `processUpcomingDerbyNotification` extraherad till `narrativeProcessor.ts`
- [x] 2D: `applyMecenatSpawn` extraherad till `eventProcessor.ts`
- [x] Inga behaviorella ändringar — enbart omflyttning
- [x] `executeTransfer` + `applyFinanceChange` borttagna från roundProcessor-imports (nu i transferProcessor)
- [x] `generateMecenat` + `generateMecenatIntroEvent` borttagna från roundProcessor-imports (nu i eventProcessor)

## Verifiering

```
npm run build → ✓ built in 8.80s
npm test      → 1858/1858 passed
npm run stress -- --seeds=3 --seasons=2 → 0 kraschar, 0 invariantbrott
```

## Commit

`96fa060` — refactor: flytta logik till rätt processors (pass 2/3)

Scope: 5 filer (4 processors + roundProcessor.ts)
