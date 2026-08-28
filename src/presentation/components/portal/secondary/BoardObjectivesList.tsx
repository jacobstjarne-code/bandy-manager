import { useState } from 'react'
import type { BoardObjective } from '../../../../domain/entities/Community'

export const STATUS_ICON: Record<BoardObjective['status'], string> = {
  active:  '📌',
  at_risk: '⚠️',
  failed:  '❌',
  met:     '✅',
}

export const STATUS_COLOR: Record<BoardObjective['status'], string> = {
  active:  'var(--text-light-secondary)',
  at_risk: 'var(--match-warn)',
  failed:  'var(--match-warn)',
  met:     'var(--match-positive)',
}

export const SORT_ORDER: Record<BoardObjective['status'], number> = { failed: 0, at_risk: 1, active: 2, met: 3 }

export function formatOwnerInitial(ownerId: string): string {
  const parts = ownerId.split(' ')
  if (parts.length >= 2) return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
  return ownerId
}

export function formatMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} mkr`
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)} tkr`
  return `${value} kr`
}

// SLUTTEST 2026-08-08 (uppföljning): formatMoney väljer enhet (kr/tkr/mkr)
// oberoende per tal — currentValue och targetValue på SAMMA rad kan då landa
// i olika enheter (t.ex. "0 kr / 100 tkr" tidigt i säsongen, growFinances).
// Enheten väljs nu en gång på det STÖRRE av de två talen och används på
// båda sidorna — samma enhet på båda sidor av snedstrecket.
export function formatMoneyPair(current: number, target: number): [string, string] {
  const scale = Math.max(Math.abs(current), Math.abs(target))
  if (scale >= 1_000_000) return [`${(current / 1_000_000).toFixed(1)} mkr`, `${(target / 1_000_000).toFixed(1)} mkr`]
  if (scale >= 1000) return [`${Math.round(current / 1000)} tkr`, `${Math.round(target / 1000)} tkr`]
  return [`${current} kr`, `${target} kr`]
}

// SLUTTEST 2026-08-08 (uppföljning 2 + RUNDA 3 punkt 3): mål där LÄGRE är
// bättre — topHalf (tabellplacering) och reduceInjuries (antal skador) —
// räknades med samma kvot som mål där högre är bättre. Ett lag på plats 9
// mot målet "topp 6" gav 9/6 = 150 %, klampat till 100: FULL stapel för ett
// mål man missar. Styrelsens krav syns i ankomstscenen och på portalen,
// alltså två av de tre första skärmarna en ny spelare ser.
//
// RIKTIG FORMEL (RUNDA 3): avståndsbaserad — (start − nuvärde) / (start − mål),
// klampad 0–1. BoardObjective.startValue (entities/Community.ts) sätts av
// createNewGame.ts/seasonEndProcessor.ts till samma värde som currentValue
// initieras med vid generering; saveGameMigration.ts backfyller äldre saves
// med currentValue som startpunkt.
const LOWER_IS_BETTER: ReadonlyArray<BoardObjective['measureFn']> = ['topHalf', 'reduceInjuries']

// Framgångskurvan steg 3, del 2 (DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 3):
// investSurplus.currentValue bytte betydelse från kassasaldo (kr, jämförbart
// med targetValue=SURPLUS_CEILING=2 mkr) till investmentCount (ett litet
// heltal — byggda noder + förlängningar + ev. nettotransferutgift denna
// säsong). targetValue är oförändrat kvar som taket som AKTIVERAR kravet,
// inte som något currentValue längre närmar sig — binärt mål (>=1 = klart),
// inte en kvot mot 2 miljoner. Måste särbehandlas i både formeln nedan och
// i render-grenen (obj.type === 'economic' hade annars kört currentValue
// genom formatMoneyPair och visat "0 kr / 2.0 mkr" för ett antal-fält).
const INVEST_SURPLUS_MEASURE = 'investSurplus'

export function computeProgressPct(obj: BoardObjective): number {
  if (obj.measureFn === INVEST_SURPLUS_MEASURE) return obj.currentValue >= 1 ? 100 : 0
  if (obj.targetValue <= 0) return 0
  if (LOWER_IS_BETTER.includes(obj.measureFn)) {
    // Fallback (binärt, samma som interimsfixen) när startValue saknas ELLER
    // redan står på/förbi målet vid start (start <= target — laget låg redan
    // topp 6 när målet begärdes). Avståndsformeln antar att start är SÄMRE än
    // målet; ett start<=target ger ett nolla eller negativt nämnare och kan
    // producera en FULL stapel åt ett lag som senare tappar och missar målet
    // — samma fellogik som bugen detta ersätter, fast via en annan väg.
    if (obj.startValue === undefined || obj.startValue <= obj.targetValue) {
      return obj.currentValue <= obj.targetValue ? 100 : 0
    }
    const pct = (obj.startValue - obj.currentValue) / (obj.startValue - obj.targetValue)
    return Math.round(Math.min(1, Math.max(0, pct)) * 100)
  }
  return Math.min(100, Math.round((obj.currentValue / obj.targetValue) * 100))
}

interface ObjRowProps {
  obj: BoardObjective
  onNavigate?: () => void
  hideProgress?: boolean
}

function ObjRow({ obj, onNavigate, hideProgress = false }: ObjRowProps) {
  const [hovered, setHovered] = useState(false)
  const isBalance = obj.measureFn === 'balanceBudget'
  const progressPct = computeProgressPct(obj)

  const progressFillColor = obj.status === 'at_risk' || obj.status === 'failed'
    ? 'var(--match-warn)'
    : obj.status === 'met'
    ? 'var(--match-positive)'
    : 'var(--accent)'

  const balanceColor = obj.currentValue >= 0 ? 'var(--match-positive)' : 'var(--match-warn)'

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`obj-row${onNavigate ? ' obj-row-clickable' : ''}${hovered && onNavigate ? ' obj-row-hovered' : ''}`}
    >
      <div className="obj-row-header">
        <div className="obj-row-title-group">
          <span className="obj-row-icon">{STATUS_ICON[obj.status]}</span>
          <span className="obj-row-label">{obj.label}</span>
        </div>
        <span className="obj-row-owner" style={{ color: STATUS_COLOR[obj.status] }}>
          {formatOwnerInitial(obj.ownerId)}
        </span>
      </div>

      {hideProgress ? null : isBalance ? (
        <div className="obj-row-balance" style={{ color: balanceColor }}>
          {obj.currentValue >= 0 ? '+' : '−'}{formatMoney(Math.abs(obj.currentValue))}
          {obj.targetValue !== 0 && (
            <span style={{ color: 'var(--text-muted)' }}>
              {' '}av mål {obj.targetValue >= 0 ? '+' : '−'}{formatMoney(Math.abs(obj.targetValue))}
            </span>
          )}
        </div>
      ) : obj.targetValue > 0 ? (
        <>
          <div className="obj-progress-header">
            <span>Framsteg</span>
            {/* 2026-08-08 (sluttest): ekonomiska mål renderade rått tal ("0 / 100000")
                trots att formatMoney låg i samma fil — bryter Tal & enheter-kortet
                (DESIGN-DECISIONS 2026-06-11: pengar i tkr/mkr, aldrig rå krona).
                Uppföljning samma dag: formatMoney(a) / formatMoney(b) var för sig
                kunde ge OLIKA enheter på de två sidorna ("0 kr / 100 tkr") —
                formatMoneyPair väljer en delad enhet på det större talet. */}
            <span className="obj-progress-value">
              {obj.measureFn === INVEST_SURPLUS_MEASURE
                ? `${obj.currentValue} investering${obj.currentValue === 1 ? '' : 'ar'}`
                : obj.type === 'economic'
                ? formatMoneyPair(obj.currentValue, obj.targetValue).join(' / ')
                : `${obj.currentValue} / ${obj.targetValue}`}
            </span>
          </div>
          <div className="obj-progress-track">
            <div className="obj-progress-fill" style={{ width: `${progressPct}%`, background: progressFillColor }} />
          </div>
        </>
      ) : null}
    </div>
  )
}

export interface BoardObjectivesListProps {
  objectives: BoardObjective[]
  max?: number
  onNavigate?: () => void
  /** 5.1 fynd 5 (SLUTTEST_KO.md, 2026-08-19): "Framsteg X/Y" mot en nyss
   *  återställd/nysatt målsättning läser som en motsägelse på Sommaren-scenen
   *  ("STYRELSEN HAR SATT NYA MÅL" bredvid en redan fylld stapel). Döljer
   *  framstegsblocket, visar bara ikon/etikett/ägare. Default false — noll
   *  påverkan på Portal/ArrivalScene:s befintliga bruk. */
  hideProgress?: boolean
}

export function BoardObjectivesList({ objectives, max = 2, onNavigate, hideProgress = false }: BoardObjectivesListProps) {
  const items = (objectives ?? [])
    .filter(o => o.status !== 'met')
    .sort((a, b) => SORT_ORDER[a.status] - SORT_ORDER[b.status])
    .slice(0, max)

  if (items.length === 0) return null

  return (
    <>
      {items.map((obj, i) => (
        <div key={obj.id} className={i > 0 ? 'obj-row-separator' : undefined}>
          <ObjRow obj={obj} onNavigate={onNavigate} hideProgress={hideProgress} />
        </div>
      ))}
    </>
  )
}
