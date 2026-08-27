# Investigation Report: Match-Revenue Economy Model

**Datum:** 2026-08-26

## 1. calcRoundIncome() — every revenue line for a home match

File: `/Users/jacobstjarne/Desktop/code_projects/bandy-manager/src/domain/services/economyService.ts`, function at lines 228-356.

`RoundIncomeBreakdown` (lines 168-181) has these income-side fields. For a home match, the lines that fire are:

| Field | Formula (home match) | Function of attendance/communityStanding? |
|---|---|---|
| weeklyBase (241) | `3000 + club.reputation * 50` | No — reputation only, every round regardless of match. |
| sponsorIncome (246-249) | `sum(sponsor.weeklyIncome) * sponsorMoodMultiplier` (mood 0-100 → ×0.914-1.086) | No — sponsor mood, not attendance. |
| matchRevenue (252-268) | see formula in section 5 below | Yes — the only line built from capacity × attendanceRate (attendanceRate uses communityStanding). |
| communityMatchIncome (271-290) | kiosk + functionaries + bandyplay + vipTent income, minus running costs — see below | No — driven by fanMood-only moodMult and flat/random amounts, not by attendanceRate, capacity, or communityStanding. |
| communityRoundIncome (294-311) | lottery + bandyplay (again) + socialMedia (cost) + bandySchool, fires every round (home or away) | No — flat/random per-toggle amounts, independent of attendance entirely. |
| volunteerIncome (313) | role-based roster sum, from volunteerService | No. |
| kommunBidrag (320-328) | once per season, `60000 × repFactor × csFactor²` where csFactor derives from communityStanding | Uses communityStanding, but not attendance/ticket count — separate, once-a-season grant. |

Costs subtracted: weeklyWages, weeklyArenaCost (capacity × 5), weeklyLegendCost, facilityUpkeep (once/season, sum of built facility nodes' upkeepCost).

**Answer:** is communityStanding/attendance used anywhere beyond ticket revenue? **NO** for the match-level income calc. `communityMatchIncome` (kiosk/vipTent/functionaries/bandyplay) is gated only on `isHomeMatch` being true and scaled by fanMood, never by attendanceRate, capacity, or communityStanding. `kommunBidrag` does use communityStanding but is a once-per-season town grant, not per-match, not per-attendee.

## 2. Kiosk / lottery / flea-market / membership-fee lines — do they exist, and are they wired?

They partially exist already, but not as attendance-scaled lines, and the backlog note's premise ("only a ticket-revenue line exists") is factually outdated:

- **Kiosk** — real, recurring income. `CommunityActivities.kiosk: 'none'|'basic'|'upgraded'` (`src/domain/entities/Community.ts:5`) drives `communityMatchIncome` in `economyService.ts:273-276` (income 1250/2500 × moodMult) and a running cost (285-286). Toggled via `academyActions.ts` UI actions.
- **Lottery (lotteri)** — real, recurring income. `CommunityActivities.lottery: 'none'|'basic'|'intensive'` drives `communityRoundIncome` at `economyService.ts:296-300` (net +200 to +1700, random), fires every round regardless of home/away — i.e. not attendance-linked at all, just a flat toggle.
- **Flea market (loppis)** — exists only as a one-off random narrative event, not a recurring stream: `src/domain/services/events/communityActivitiesEvents.ts:153-168`, round 4, 40% chance, amount `5000 + rand()*3000`, applied via the generic `'income'` effect (`eventResolver.ts:730-736`, a direct `applyFinanceChange` call). It never enters `calcRoundIncome`, is never logged with attendance context, and the UI (`EkonomiTab.tsx:174`) explicitly labels it `'Slumpmässig händelse'` / `noAction: true` with `income: '—'`.
- **Christmas market (julmarknad)** — same pattern as loppis: one-time toggle event at round 7 (`communityActivitiesEvents.ts:126-139`), `setCommunity` effect applies a one-time flat 8000 kr via `applyFinanceChange` (`eventResolver.ts:587-593`), then just flips a boolean flag that is never read again for income. Not recurring, not attendance-scaled.
- **Kiosk facility node ("Kiosk & servering")** — a second, unrelated "kiosk" concept: a one-time capital investment in `src/domain/data/facilityNodes.ts:94-109` (cost 80000, upkeep 6700/season). Its consequences array contains the flavor line `{ dim: 'ekonomi', dir: 'up', label: 'Försäljningsintäkter' }` ("sales revenue") — but this is pure flavor text, consumed only by `FacilityTree.tsx` (display rows) and `valetScene.ts` (narrative dialogue). The only mechanical effect of building this node is `facilitiesBonus: 3` (bumps `club.facilities` stat) plus the once-per-season upkeep cost subtracted in `calcRoundIncome`. It generates zero actual sales income despite promising it in the UI text — a genuine inbox-only/flavor item.
- **Membership fees (medlemsavgift/membership)** — grep across `src/` found: (a) a single line of ambient dialogue in `coffeeRoomService.ts:110` ("Medlemsavgifterna trillar in nu" / "kassören") — flavor only, no numeric effect; (b) an unrelated `'membership'` choice id in `seasonEndProcessor.ts:1062-1066` labelled "Medlemsdrivning" which applies `{ type: 'communityStanding', amount: 8 }` — a reputation/standing effect, not an income effect. No membership-fee revenue line exists anywhere.

Summary table:

| Concept | Exists? | Recurring / attendance-linked? |
|---|---|---|
| Kiosk (CommunityActivities) | Yes | Recurring, per home match — but fanMood-scaled, not attendance/capacity-scaled |
| Lottery | Yes | Recurring, per round — flat toggle, not attendance-linked |
| Loppis (flea market) | Yes | One-off random event only, bypasses `calcRoundIncome` entirely |
| Julmarknad (Christmas market) | Yes | One-off toggle event, flat 8000 kr, bypasses `calcRoundIncome` |
| Kiosk facility node | Yes (name collision) | Flavor text only ("Försäljningsintäkter") — zero economic effect |
| Membership fees | No | Not modeled anywhere as income |

## 3. computeAttendanceRate() — output and wiring

File: `economyService.ts:134-147`.

```ts
export function computeAttendanceRate(
  fanMood: number, communityStanding: number, position: number, moodWeight = 1,
): number {
  return Math.min(0.95,
    0.20 + (fanMood/100)*0.25*moodWeight + (communityStanding/100)*0.45*moodWeight
    + (position <= 3 ? 0.08*moodWeight : 0))
}
```

Output: a rate in `[0.20, 0.95]`, not an absolute attendance count.

Confirmed callers (grepped repo-wide, non-test): exactly two, both in `economyService.ts` — line 258 inside `calcRoundIncome` (feeds `matchRevenue`'s `baseRevenue = capacity * attendanceRate * ticketPrice * ...`), and line 426 inside `calcAttendance` (feeds the displayed attendance number `Math.round(calcBase * attendanceRate * ...)`, used by `matchSimProcessor.ts` and `MatchScreen.tsx` purely for the UI attendance figure).

It does not feed `communityMatchIncome`, `communityRoundIncome`, `kommunBidrag`, or any other stream. Confirmed: communityStanding's only income path today is (a) ticket revenue via attendanceRate, and (b) the once-per-season `kommunBidrag` town grant — nothing per-match/kiosk/lottery reads it.

## 4. Community/facility entities — existing kiosk/lottery-like structures for one-time investment

`Community.ts` (`FacilityNodeDef`, lines 103-118) already models one-time capital community investments generically: `cost`, `buildRounds`, `upkeepCost` (season upkeep, wired into `calcRoundIncome`'s `facilityUpkeep`), `facilitiesBonus` (stat bump), `consequences` (display-only flavor array). The kiosk facility node (section 2 above) is exactly this shape — a piggyback point exists structurally, but it currently has no economic hook; its consequences claim revenue it doesn't deliver.

Separately, `CommunityActivities` (`Community.ts:4-17`) is the toggle-based per-round/per-match activity model already wired into `calcRoundIncome` (kiosk/lottery/bandyplay/functionaries/vipTent/bandySchool/socialMedia) — this is the natural home for any new recurring revenue post, and it's explicitly commented (`economyService.ts:216-227`) as already split into "communityMatchIncome" (home-match-gated) vs "communityRoundIncome" (every round) buckets. No `activateCommunity` action name was found in the codebase (grepped `academyActions.ts`, the toggle-setter uses direct `communityKey`/`communityValue` effects instead — worth noting the session notes' terminology doesn't exactly match current code naming).

A conflict risk: the facility-node kiosk and the `CommunityActivities.kiosk` toggle are two independently-named "kiosk" concepts already coexisting (one is a one-time capital build with flavor-only sales text; the other is a toggle with real recurring income). Any new attendance-scaled kiosk revenue needs to pick one home explicitly or reconcile both.

## 5. Exact current match-income formula (all terms, all multipliers)

From `calcRoundIncome`, `economyService.ts:255-290`, when `isHomeMatch`:

```
capacity      = club.arenaCapacity ?? round(reputation*7 + 150)
position      = standing.position ?? 8
attendanceRate = computeAttendanceRate(fanMood, communityStanding ?? 50, position)   // 0.20–0.95
ticketPrice   = 50 + round(reputation * 0.3)

baseRevenue = round(
  capacity * attendanceRate * ticketPrice
  * journalistAttendanceModifier   // 0.95 / 1.0 / 1.10, default 1.0
  * weatherAttendanceModifier      // effectiveWeatherAttendance(), default 1.0
)

formBonus  = position<=3 ? 1.15 : position<=6 ? 1.05 : position>=10 ? 0.88 : 1.0
eventBonus = matchIsKnockout ? 1.40 : matchIsCup ? 1.20 : 1.0
derbyBonus = matchHasRivalry ? 1.25 : 1.0

matchRevenue = round(baseRevenue * formBonus * eventBonus * derbyBonus + rand()*2000)
```

Then, additively, still gated on `isHomeMatch`, the separate `communityMatchIncome` bucket (`economyService.ts:271-290`):

```
moodMult   = 0.7 + (fanMood/100)*0.6                       // 0.7–1.3, NOT attendanceRate
kioskBase  = kiosk==='upgraded' ? 2500 : kiosk==='basic' ? 1250 : 0
communityMatchIncome = round(kioskBase * moodMult)
                      + (functionaries ? 1000 : 0)
                      + (bandyplay ? 250 + round(rand()*250) : 0)
                      + (vipTent ? 1250 + round(rand()*2500) : 0)
                      - runningCost   // kiosk 1500/2500, bandyplay 1000, vipTent 2000
```

And per-round (home or away), `communityRoundIncome` (293-311):

```
lottery: intensive → +(1500+rand()*1000)-800 ; basic → +(500+rand()*750)-500
bandyplay → +(250+rand()*500)-1000
socialMedia → -500
bandySchool → +1000
```

`matchRevenue` and `communityMatchIncome` are logged as two separate `FinanceEntry` lines by `economyProcessor.ts:100-108` (`match_revenue` vs `community_round` reason) though both share the underlying "home match happened" gate — they do not share any multiplier terms; capacity/attendanceRate/formBonus/eventBonus/derbyBonus apply only to `matchRevenue`, never to the kiosk/vipTent/functionaries/bandyplay figures.

---

Both investigations landed. Key finding: the sponsor threshold at communityStanding 70/71 is confirmed general — a hardcoded `cs > 70` cutoff with zero per-club scoping, affecting any club that crosses it. And the spectator-economy question has a clear answer: kiosk/lottery already exist and are wired in, but scale only with fanMood, never with actual attendance — exactly the gap Jacob's decision named.
