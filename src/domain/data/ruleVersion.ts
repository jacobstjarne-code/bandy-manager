/**
 * K4 (SLUTTEST-KÖN, 2026-08-17): fältet kan bara fyllas framåt, samma logik
 * som builtSeason (facilityService.ts) — en karriär som skapas utan en
 * sparad regelversion kan aldrig jämföras rättvist mot en annan i efterhand.
 *
 * Bump denna sträng när en balansändring landar (en åt gången, aldrig i
 * klump — se ARBETSMODELL i SLUTTEST_KO.md). Ingen konsument läser den än.
 */
export const CURRENT_RULE_VERSION = '2026-08-17'
