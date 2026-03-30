import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { Club } from '../../../domain/entities/Club'
import type { SaveGame, StandingRow } from '../../../domain/entities/SaveGame'
import { ClubExpectation, ClubStyle } from '../../../domain/enums'
import { StatBar } from '../StatBar'
import { SectionCard } from '../SectionCard'
import { exportSaveAsJson, importSaveFromJson } from '../../../infrastructure/persistence/saveGameStorage'

function expectationLabel(e: ClubExpectation): string {
  const map: Record<ClubExpectation, string> = {
    [ClubExpectation.AvoidBottom]: 'Undvika nedflyttning',
    [ClubExpectation.MidTable]: 'Mitten av tabellen',
    [ClubExpectation.ChallengeTop]: 'Utmana toppen',
    [ClubExpectation.WinLeague]: 'Vinna ligan',
  }
  return map[e] ?? e
}

function styleLabel(s: ClubStyle): string {
  const map: Record<ClubStyle, string> = {
    [ClubStyle.Defensive]: 'Defensiv',
    [ClubStyle.Balanced]: 'Balanserad',
    [ClubStyle.Attacking]: 'Anfallsinriktad',
    [ClubStyle.Physical]: 'Fysisk',
    [ClubStyle.Technical]: 'Teknisk',
  }
  return map[s] ?? s
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 10,
      marginBottom: 10,
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function FacilityRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
      </div>
      <StatBar value={value} color='var(--accent)' height={5} />
    </div>
  )
}

interface KlubbTabProps {
  club: Club
  game: SaveGame
  standing: StandingRow | null | undefined
  navigate: NavigateFunction
}

export function KlubbTab({ club, game, standing, navigate }: KlubbTabProps) {
  const [importStatus, setImportStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  async function handleImport() {
    setImportStatus('idle')
    const imported = await importSaveFromJson()
    if (imported) {
      setImportStatus('ok')
      setTimeout(() => setImportStatus('idle'), 3000)
    } else {
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 3000)
    }
  }

  return (
    <>
      <SectionCard title="🏟️ Faciliteter" stagger={1}>
        <FacilityRow label="Anläggningar" value={club.facilities} />
        <FacilityRow label="Ungdomskvalitet" value={club.youthQuality} />
        <FacilityRow label="Ungdomsrekrytering" value={club.youthRecruitment} />
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Ungdomsutveckling</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{club.youthDevelopment}</span>
          </div>
          <StatBar value={club.youthDevelopment} color='var(--accent)' height={5} />
        </div>
      </SectionCard>

      <SectionCard title="🎯 Förväntan & profil" stagger={2}>
        <InfoRow label="Styrelseförväntning" value={expectationLabel(club.boardExpectation)} />
        <InfoRow label="Supporterförväntning" value={expectationLabel(club.fanExpectation)} />
        <InfoRow label="Spelstil" value={styleLabel(club.preferredStyle)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Konstis</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{club.hasArtificialIce ? 'Ja' : 'Nej'}</span>
        </div>
      </SectionCard>

      {standing && (
        <SectionCard title="📊 Tabellposition" stagger={3}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{standing.position}:e</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {standing.points}p · {standing.wins}V {standing.draws}O {standing.losses}F · MS {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
            </span>
          </div>
        </SectionCard>
      )}

      {game.seasonSummaries && game.seasonSummaries.length > 0 && (
        <SectionCard title="📅 Säsongshistorik" stagger={4}>
          {[...game.seasonSummaries].reverse().map(s => {
            const posColor = s.finalPosition <= 3 ? 'var(--accent)' : s.finalPosition >= 10 ? 'var(--danger)' : 'var(--text-primary)'
            let playoffLabel = ''
            if (s.playoffResult === 'champion') playoffLabel = '🏆'
            else if (s.playoffResult === 'finalist') playoffLabel = '🥈'
            else if (s.playoffResult === 'semifinal') playoffLabel = 'SF'
            else if (s.playoffResult === 'quarterfinal') playoffLabel = 'KF'
            return (
              <div
                key={s.season}
                onClick={() => navigate(`/game/season-summary/${s.season}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', minWidth: 48 }}>{s.season}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: posColor, minWidth: 32, textAlign: 'center' }}>{s.finalPosition}.</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 52, textAlign: 'center' }}>{s.points} p</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, textAlign: 'right' }}>{playoffLabel}</span>
                <span style={{ fontSize: 14, color: 'var(--accent)', marginLeft: 8 }}>→</span>
              </div>
            )
          })}
          <button
            className="btn btn-outline"
            onClick={() => navigate('/game/history')}
            style={{ width: '100%', marginTop: 8 }}
          >
            Hall of Fame & full historik →
          </button>
        </SectionCard>
      )}

      <button
        className="btn btn-ghost"
        onClick={() => navigate('/game/doctor')}
        style={{ width: '100%' }}
      >
        🩺 Bandydoktorn →
      </button>

      <SectionCard title="💾 Hantera sparat spel" stagger={5}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-outline"
            onClick={() => exportSaveAsJson(game)}
            style={{ flex: 1, fontSize: 13 }}
          >
            Exportera save
          </button>
          <button
            className="btn btn-outline"
            onClick={handleImport}
            style={{ flex: 1, fontSize: 13 }}
          >
            Importera save
          </button>
        </div>
        {importStatus === 'ok' && (
          <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>
            Spelet importerades. Gå till startmenyn och ladda ditt spel.
          </p>
        )}
        {importStatus === 'error' && (
          <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8 }}>
            Kunde inte läsa filen. Kontrollera att det är en giltig save-fil.
          </p>
        )}
      </SectionCard>
    </>
  )
}
