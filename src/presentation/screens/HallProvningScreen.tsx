import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { computeKravStatus, formatHallNodeSub } from '../../domain/services/events/hallProcessService'
import { STOD_LABELS } from '../../domain/data/hallProvningData'
import { FACILITY_NODE_DEFS } from '../../domain/services/facilityService'

const tkr = (n: number) => `${Math.round(n / 1000)} tkr`

/**
 * H·1 — Hallprövningens hub. Nås via chevron på matchhall-noden (FacilityTree/
 * FacilityScreen), en gång byggd åt gången, inte en scen per beslut.
 *
 * Mock: docs/incoming/Ytkarta - hallprövning & landslag (fristående).html
 * ("Bygg inte en scen per beslut. Ett återkommande hub... Fast anatomi,
 * växlande innehåll per fas: stödmätaren överst (regel 14-form) → fasens
 * vägval → sidfotsmallens bekräftelse.")
 *
 * SCOPE-BESLUT (release-svepet 2026-07-22, rapporterat till Jacob): hubben är
 * en STATUS-VISARE, inte en andra beslutsyta. De faktiska vägvalen
 * (förankringens tre decisions, förhandlingens kommun/patron-val) genereras
 * redan som vanliga GameEvent-kort av hallProcessService.ts och renderas via
 * den delade Portal-event-pipen (PortalEventSlot → EventCardInline,
 * attentionRouter.ts). Att DUBBLERA de valen inline i hubben hade krävt att
 * samma events antingen (a) visas två gånger (Portal + hub) eller (b)
 * undertrycks i attentionRouter för hallProcess-typen — en ändring i ett
 * delat, prioritetskänsligt system som många andra event-typer också litar
 * på. Det är en större, egen avvägning än vad "bygg hubben" kräver. Hubben
 * visar därför bara stöd-mätaren + krav-checklistan + fas-status (allt utan
 * egen UI-yta idag) och länkar inte om de redan fungerande decision-korten.
 */
export default function HallProvningScreen() {
  const game = useGameStore(s => s.game)
  const navigate = useNavigate()
  if (!game) return null

  const trial = game.facilityState?.hallTrial
  const stage = trial?.stage ?? 'vilande'
  const stageLabel: Record<typeof stage, string> = {
    vilande: 'VILANDE',
    forankring: 'FÖRANKRING',
    krav: 'KRAV',
    forhandling: 'FÖRHANDLING',
    bygge: 'BYGGE',
    klar: 'KLAR',
    nedlagd: 'NEDLAGD',
    bordlagd: 'BORDLAGD',
  }
  const nodeDef = FACILITY_NODE_DEFS.find(d => d.isHall)
  const subText = formatHallNodeSub(game)

  return (
    <div className="screen-col-layout">
      {/* Header — matchar FacilityScreen.tsx:s konvention */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', height: 44, flexShrink: 0,
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <button
          onClick={() => navigate('/game/bygget')}
          style={{ background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 }}
          aria-label="Tillbaka"
        >←</button>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {nodeDef?.label ?? 'Matchhallen'}
        </span>
        <span className="h-micro" style={{
          marginLeft: 'auto', color: 'var(--cold)', letterSpacing: '1.5px',
        }}>
          🏟️ {stageLabel[stage]}
        </span>
      </div>

      <div className="screen-scroll" style={{ padding: '16px 14px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Stöd-mätare — regel 14: värde (Georgia) + dimensionsrad + läsning. Bara under förankring. */}
        {stage === 'forankring' && (
          <div className="card-sharp" style={{ padding: '14px 16px' }}>
            <p className="h-label">STÖD I BYGDEN</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                {trial?.support ?? 0}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{
              height: 4, borderRadius: 'var(--radius-sm)', marginTop: 8, marginBottom: 10,
              background: 'var(--border)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${Math.max(0, Math.min(100, trial?.support ?? 0))}%`,
                background: 'linear-gradient(90deg, var(--warm), var(--gold))',
              }} />
            </div>
            <p className="h-quote-sm" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              {(trial?.support ?? 0) >= 60 ? STOD_LABELS.high : (trial?.support ?? 0) >= 40 ? STOD_LABELS.mid : STOD_LABELS.low}
            </p>
          </div>
        )}

        {/* Krav-checklista — computeKravStatus, samma rena funktion som gaten mot förhandlingen */}
        {stage === 'krav' && (
          <div className="card-sharp" style={{ padding: '14px 16px' }}>
            <p className="h-label">KRAV</p>
            {(() => {
              const krav = computeKravStatus(game)
              const rows: Array<[string, boolean]> = [
                ['Kassa/mecenat', krav.kapital],
                ['Publikunderlag', krav.underlag],
                ['Styrelsebeslut', krav.styrelse],
              ]
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  {rows.map(([label, met]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: met ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700 }}>
                        {met ? '✓' : '·'}
                      </span>
                      <span style={{ color: met ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* Förhandling — finansieringsläge om satt, annars väntar-status */}
        {stage === 'forhandling' && (
          <div className="card-sharp" style={{ padding: '14px 16px' }}>
            <p className="h-label">FÖRHANDLING</p>
            <p className="h-quote-sm" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
              {trial?.finansiering
                ? `Finansiering: ${trial.finansiering === 'kommun' ? 'Kommunen' : trial.finansiering === 'patron' ? 'Patronen' : 'Klubben själv'}`
                : subText}
            </p>
          </div>
        )}

        {/* Bygge — kostnad + eta */}
        {stage === 'bygge' && nodeDef && (
          <div className="card-sharp" style={{ padding: '14px 16px' }}>
            <p className="h-label">BYGGE</p>
            <p className="h-quote-sm" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
              {tkr(nodeDef.cost)} · {subText}
            </p>
          </div>
        )}

        {/* Vilande/klar/nedlagd/bordlagd — HALLNODE_SUBS bär hela statusen */}
        {(stage === 'vilande' || stage === 'klar' || stage === 'nedlagd' || stage === 'bordlagd') && (
          <div className="card-sharp" style={{ padding: '14px 16px' }}>
            <p className="h-quote-sm" style={{ color: 'var(--text-secondary)' }}>{subText}</p>
          </div>
        )}

        <p className="h-quote-sm" style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
          Inget är förvalt.
        </p>
      </div>
    </div>
  )
}
