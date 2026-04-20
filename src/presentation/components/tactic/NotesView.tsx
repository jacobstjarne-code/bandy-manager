import { useMemo } from 'react'
import type { Player } from '../../../domain/entities/Player'
import type { AssistantCoach } from '../../../domain/entities/AssistantCoach'
import { generatePlayerNotes, type NoteTag } from '../../../domain/services/playerNotesService'

interface NotesViewProps {
  coach: AssistantCoach
  players: Player[]
  captainPlayerId: string | undefined
}

const TAG_STYLES: Record<NoteTag, { bg: string; color: string; label: string }> = {
  'trött':     { bg: 'rgba(176,80,64,0.15)',  color: 'var(--danger)',  label: 'TRÖTT' },
  'glödande':  { bg: 'rgba(90,154,74,0.15)',  color: 'var(--success)', label: 'GLÖDANDE' },
  'missnöjd':  { bg: 'rgba(196,122,58,0.15)', color: 'var(--accent)',  label: 'MISSNÖJD' },
  'skottform': { bg: 'rgba(126,179,212,0.2)', color: 'var(--ice, #7eb3d4)', label: 'SKOTTFORM' },
  'vill-mer':  { bg: 'rgba(196,122,58,0.15)', color: 'var(--accent)',  label: 'VILL MER' },
  'sviktande': { bg: 'rgba(176,80,64,0.15)',  color: 'var(--danger)',  label: 'SVIKTANDE' },
}

const POSITION_COLORS: Record<string, string> = {
  Goalkeeper: 'var(--warning)',
  Defender:   'var(--ice, #7eb3d4)',
  Half:       'var(--success)',
  Midfielder: 'var(--accent)',
  Forward:    'var(--danger)',
}

function NoteTagBadge({ tag }: { tag: NoteTag }) {
  const s = TAG_STYLES[tag]
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
      background: s.bg, color: s.color, letterSpacing: '1px', marginLeft: 'auto', flexShrink: 0,
    }}>
      {s.label}
    </span>
  )
}

export function NotesView({ coach, players, captainPlayerId }: NotesViewProps) {
  const notes = useMemo(
    () => generatePlayerNotes(players, coach, captainPlayerId),
    [players, coach, captainPlayerId],
  )

  return (
    <>
      {/* Coach intro */}
      <div style={{
        display: 'flex', gap: 10, padding: '10px 12px',
        background: 'var(--bg-surface)', borderRadius: 6, marginBottom: 10,
        border: '0.5px solid var(--border)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--bg-leather)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {coach.initials}
          </span>
        </div>
        <div>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 2 }}>
            {coach.name.toUpperCase()} · ASSISTENT
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {notes.length > 0
              ? `"${notes.length} spelare att hålla koll på inför nästa match."`
              : '"Inga särskilda anteckningar just nu. Gruppen är jämn."'
            }
          </p>
        </div>
      </div>

      {/* Notes list */}
      {notes.map(note => {
        const p = players.find(pl => pl.id === note.playerId)
        if (!p) return null
        const posColor = POSITION_COLORS[p.position] ?? 'var(--accent)'
        return (
          <div key={note.playerId} style={{
            padding: '10px 12px', border: '0.5px solid var(--border)',
            borderRadius: 6, marginBottom: 8, background: 'var(--bg-surface)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Position circle */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: posColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, opacity: 0.85,
              }}>
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>
                  {p.position.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-primary)' }}>
                {p.firstName} {p.lastName}
              </span>
              <NoteTagBadge tag={note.tag} />
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 36, marginTop: 3 }}>
              {note.metadata}
            </p>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontStyle: 'italic',
              color: 'var(--text-secondary)', marginLeft: 36, marginTop: 6, lineHeight: 1.5,
            }}>
              "{note.quote}"
            </p>
          </div>
        )
      })}
    </>
  )
}
