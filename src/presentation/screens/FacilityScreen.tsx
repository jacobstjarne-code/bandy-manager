import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { FacilityTree } from '../components/club/FacilityTree'
import {
  FACILITY_NODE_DEFS, getFinancingOptions, getFacilityNodeViews, decommissionSubtitle,
  DECOMMISSION_COMMUNITY_STANDING_COST, type FinancingContext, type FinancingOption,
} from '../../domain/services/facilityService'
import { financingFlavor } from '../../domain/data/facilityFinancingStrings'
import { formatHallNodeSub } from '../../domain/services/events/hallProcessService'
import { Overlay } from '../components/primitives/Overlay'

const tkr = (n: number) => `${Math.round(n / 1000)} tkr`

function optionTitle(o: FinancingOption): string {
  if (o.mode === 'club') return 'Egen kassa'
  if (o.mode === 'kommun') return 'Kommunen'
  return o.contributorName ?? 'Mecenat'
}

// B1 §4 — dynamisk konsekvensrad: speglar vald finansiering.
function optionSub(o: FinancingOption): string {
  if (o.mode === 'club') return `Kassa −${tkr(o.clubCost)}`
  const who = o.mode === 'kommun' ? 'Kommunen' : (o.contributorName ?? 'Mecenaten')
  return `Kassa −${tkr(o.clubCost)} · ${who} står för ${tkr(o.contribution)}`
}

export default function FacilityScreen() {
  const game = useGameStore(s => s.game)
  const startFacilityBuildNode = useGameStore(s => s.startFacilityBuildNode)
  const decommissionFacilityNode = useGameStore(s => s.decommissionFacilityNode)
  const navigate = useNavigate()
  // B1-nav: Bygget är en flik-destination (ingen tillbaka-pil); facility-routen är push (deep-link) → pil kvar.
  const isTab = useLocation().pathname === '/game/bygget'
  const [mode, setMode] = useState<'betrakta' | 'valj'>('betrakta')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!game) return null

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const facilityState = game.facilityState ?? { builtNodeIds: [] }
  // S1-lås: säsong 1 visas trädet som ASPIRATION (betrakta-läge), bygge låst tills säsong 2.
  // Valet-ceremonin fyrar ej i S1 — Bygget-fliken är den enda vägen, och ska även den vara låst.
  const isSeason1 = (game.seasonSummaries?.length ?? 0) === 0

  const selectedDef = selectedNodeId ? FACILITY_NODE_DEFS.find(d => d.id === selectedNodeId) ?? null : null
  // O17 del 3: samma nodval öppnar antingen finansieringssheeten (available)
  // eller avvecklingssheeten (built) — statusen avgör, inte en andra prop.
  const selectedView = selectedNodeId
    ? getFacilityNodeViews(facilityState, game.currentMatchday).find(v => v.def.id === selectedNodeId) ?? null
    : null
  const selectedIsBuilt = selectedView?.status === 'built'

  // B1 §2 — finansieringskontext ur nuläget (relation/standing/mecenat).
  const pol = game.localPolitician
  const activeMecenat = (game.mecenater ?? []).find(m => m.isActive && m.wealth >= 3 && m.happiness >= 50)
  const ctx: FinancingContext = {
    relationship: pol?.relationship ?? 0,
    standing: game.communityStanding ?? 50,
    mecenat: activeMecenat ? { name: activeMecenat.name, willing: true } : undefined,
  }
  const options = selectedDef ? getFinancingOptions(selectedDef, ctx) : []

  function handleBuild(financingMode: FinancingOption['mode']) {
    if (!selectedNodeId) return
    const res = startFacilityBuildNode(selectedNodeId, financingMode)
    if (res.success) {
      setSelectedNodeId(null)
      setMode('betrakta')
      setError(null)
    } else {
      setError(res.error ?? 'Kunde inte starta bygget')
    }
  }

  function handleDecommission() {
    if (!selectedNodeId) return
    const res = decommissionFacilityNode(selectedNodeId)
    if (res.success) {
      setSelectedNodeId(null)
      setMode('betrakta')
      setError(null)
    } else {
      setError(res.error ?? 'Kunde inte avvecklas')
    }
  }

  return (
    <div className="screen-col-layout">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', height: 44, flexShrink: 0,
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        {!isTab && (
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', padding: '4px 2px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 }}
            aria-label="Tillbaka"
          >←</button>
        )}
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {managedClub?.name ?? 'Anläggningen'}
        </span>
        {/* B1 §3 — välj-mode löpande (när som helst, inte bara PreSeason) */}
        {!facilityState.activeProject && !isSeason1 && (
          <button
            onClick={() => { setMode(m => m === 'valj' ? 'betrakta' : 'valj'); setSelectedNodeId(null); setError(null) }}
            className={`btn ${mode === 'valj' ? 'btn-copper' : 'btn-outline'}`}
            style={{ marginLeft: 'auto', fontSize: 12, padding: '5px 12px' }}
          >
            {mode === 'valj' ? 'Avbryt' : 'Bygg ut'}
          </button>
        )}
        {isSeason1 && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Valet öppnar nästa säsong
          </span>
        )}
      </div>

      {/* Tree */}
      <div className="screen-scroll" style={{ padding: '12px 12px 24px' }}>
        <FacilityTree
          facilityState={facilityState}
          currentMatchday={game.currentMatchday}
          currentSeason={game.currentSeason}
          mode={mode}
          onSelect={(id) => {
            // Block 3a: hallnoden öppnar H·1-hubben, inte finansieringssheeten
            // (den har inget att finansiera direkt — bygget startar via
            // förhandlingens vägval, ett GameEvent).
            const def = FACILITY_NODE_DEFS.find(d => d.id === id)
            if (def?.isHall) { navigate('/game/hall-provning'); return }
            setSelectedNodeId(id)
            setError(null)
          }}
          clubName={managedClub?.arenaName ?? managedClub?.name}
          hallNodeSub={formatHallNodeSub(game)}
        />
      </div>

      {/* H1 (människoupplevelse-audit 7024f8a, 2026-08-24): båda sheeterna nedan
          täcktes geometriskt av bottennavigationen — CTA:n hade bara ~6px fri
          kant, findTapTargetViolations mätte 32px överlapp vid 320/390/430px.
          Staplingsordningen var redan korrekt (sheeten 300 mot navets 99/100)
          — fixen är åtgärdsutrymme, inte z-index. Gördel och hängslen: navet
          blockeras dessutom för pekhändelser medan en sheet är öppen, så en
          framtida regression i clearance-beräkningen inte kan återskapa buggen. */}
      {selectedDef && (
        <style>{'[data-bottom-nav] { pointer-events: none; }'}</style>
      )}
      {/* B1 §2/§4 — finansieringsval (bottensheet). M4 (audit 5c9a7a8,
          2026-08-24): migrerad till Overlay-primitiven — hade tidigare
          varken role/aria-modal, fokusfälla, Escape eller inert bakgrund. */}
      {selectedDef && !selectedIsBuilt && (
        <Overlay onClose={() => setSelectedNodeId(null)} variant="sheet" ariaLabel={`Finansiering — ${selectedDef.label}`}>
          <div
            style={{ padding: '18px 16px calc(var(--bottom-nav-height, 60px) + var(--safe-bottom, 0px) + 44px)', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div>
              <div className="h-label">Finansiering</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDef.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Full kostnad {tkr(selectedDef.cost)} · {selectedDef.buildRounds} omgångar att bygga</p>
            </div>
            {/* H1 (2026-08-24): findTapTargetViolations mätte bara 12px fri kant
                mellan de här knapparna — 44px-kravet gäller här också, eftersom
                hela sheeten är en position:fixed-förfader (grinden räknar då
                varje knapp som en "sticky CTA", se tapTargetOverlap.ts). Egen
                gap istf sheetens generella 12px, resten av layouten orörd. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
              {options.map(o => (
                <button
                  key={o.mode}
                  disabled={!o.available}
                  onClick={() => handleBuild(o.mode)}
                  className="btn"
                  style={{
                    textAlign: 'left', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2,
                    background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    opacity: o.available ? 1 : 'var(--disabled-opacity)', cursor: o.available ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{optionTitle(o)}</span>
                  <span style={{ fontSize: 11, color: o.available ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {o.available ? optionSub(o) : o.reason}
                  </span>
                  {(() => {
                    const flavor = financingFlavor(
                      o.mode,
                      o.available,
                      { politician: pol?.name, mecenat: ctx.mecenat?.name },
                      `${selectedDef.id}:${o.mode}:${facilityState.builtNodeIds.length}`,
                    )
                    return flavor
                      ? <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 1 }}>{flavor}</span>
                      : null
                  })()}
                </button>
              ))}
            </div>
            {error && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
          </div>
        </Overlay>
      )}

      {/* O17 del 3 — avvecklingssheet. Undertexten är låst text (Jacobs dom
          2026-08-23): {Nod} stängs [efter {N} år]. Folk kommer att märka det. */}
      {selectedDef && selectedIsBuilt && (
        <Overlay onClose={() => setSelectedNodeId(null)} variant="sheet" ariaLabel={`Avveckla — ${selectedDef.label}`}>
          <div
            style={{ padding: '18px 16px calc(var(--bottom-nav-height, 60px) + var(--safe-bottom, 0px) + 44px)', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div>
              <div className="h-label">Avveckla</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedDef.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                {decommissionSubtitle(selectedDef, selectedView?.completedSeason, game.currentSeason)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Lokalt stöd −{DECOMMISSION_COMMUNITY_STANDING_COST}
              </p>
            </div>
            <button
              onClick={handleDecommission}
              className="btn"
              style={{
                textAlign: 'left', padding: '10px 12px',
                background: 'transparent', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)',
                color: 'var(--danger-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Avveckla {selectedDef.label}
            </button>
            {error && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
          </div>
        </Overlay>
      )}
    </div>
  )
}
