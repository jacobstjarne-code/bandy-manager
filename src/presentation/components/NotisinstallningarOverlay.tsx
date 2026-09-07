import { useState } from 'react'
import { Overlay } from './primitives/Overlay'
import { ToggleSwitch } from './primitives/ToggleSwitch'
import type { SaveGame } from '../../domain/entities/SaveGame'
import type { AttentionCategory, NotificationPreferences } from '../../domain/attention/types'
import { getNotificationPreferences, setNotificationPreferences, unsubscribeFromClubNotifications } from '../../infrastructure/attention/attentionClient'
import { seasonSpanLabel } from '../../domain/utils/seasonYear'

/**
 * Notisinstallningar — inställningsyta för push-kategorier + tysta timmar.
 * Mock: docs/incoming/Notisinstallningar.dc.html (PUSH · ORDER 1).
 * Skal: samma Overlay-mönster som KlubbparmOverlay — topp-ankrad, läder-
 * header, ljus kropp, 360px.
 *
 * stickiness-settings-kategorier (Opus dom 2026-09-07): Designs mock
 * använde interna namn (Kalenderankare/Säsongsläge/Klubbminne) i stället
 * för registrets LÅSTA spelar-etiketter. Etiketter + introrad nedan är de
 * RÄTTADE, LÅSTA texterna — inte mockens ordagranna platshållare.
 * Beskrivningsraderna är oförändrade (Design skrev dem, Opus bekräftade
 * dem låsta i samma dom).
 *
 * stickiness-avregistrering-yta (Jacob 2026-09-07, "hoppa mocken, ge Code
 * raden direkt"): "Tysta"-knappen längst ner, text låst i
 * STICKINESS_COPY_REGISTER_2026-09-04.md §7 "Avregistrering". Irreversibel
 * (raderar allt server-side, se attentionClient.ts/store.js "local-first-
 * domen") — bekräftas i två steg innan `unsubscribeFromClubNotifications()`
 * anropas, samma försiktighet som andra hård-att-ångra åtgärder i appen.
 */

interface NotisinstallningarOverlayProps {
  game: SaveGame
  onClose: () => void
}

const CATEGORY_ROWS: { key: AttentionCategory; label: string; description: string }[] = [
  { key: 'match_preparation', label: 'Matchförberedelse', description: 'Påminnelse om att ta ut laget.' },
  { key: 'narrative_return', label: 'Klubbens minne', description: 'Berättarens återblickar.' },
  { key: 'calendar_anchor', label: 'Derbyn, cup och slutspel', description: 'Derby, cup och final på gång.' },
  { key: 'season_context', label: 'Tabelläget', description: 'När det stramar åt i tabellen.' },
]

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function timeInputValue(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`
}

function timeDisplay(hour: number, minute: number): string {
  return `${pad2(hour)}.${pad2(minute)}`
}

export function NotisinstallningarOverlay({ game, onClose }: NotisinstallningarOverlayProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences)
  const [confirmingMute, setConfirmingMute] = useState(false)
  const [isMuting, setIsMuting] = useState(false)

  const club = game.clubs.find(c => c.id === game.managedClubId)
  const clubLabel = `${(club?.shortName ?? club?.name ?? '').toUpperCase()} · ${seasonSpanLabel(game.currentSeason)}`

  const applyPrefs = (next: NotificationPreferences) => {
    setPrefs(next)
    void setNotificationPreferences(next)
  }

  const toggleCategory = (key: AttentionCategory) => {
    applyPrefs({ ...prefs, categories: { ...prefs.categories, [key]: !prefs.categories[key] } })
  }

  const setQuietHour = (field: 'start' | 'end', value: string) => {
    const [hourStr, minuteStr] = value.split(':')
    const hour = Number(hourStr)
    const minute = Number(minuteStr)
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return
    applyPrefs({
      ...prefs,
      quietHours: field === 'start'
        ? { ...prefs.quietHours, startHour: hour, startMinute: minute }
        : { ...prefs.quietHours, endHour: hour, endMinute: minute },
    })
  }

  const confirmMute = async () => {
    setIsMuting(true)
    try {
      await unsubscribeFromClubNotifications()
    } catch {
      // unsubscribeFromClubNotifications() städar redan lokalt state i sin
      // egen finally-gren (subscription/identity) oavsett nätverksutfall —
      // en misslyckad server-radering ska inte hindra spelaren från att
      // stänga ytan. Serverns kvarvarande installation raderas av samma
      // anrop nästa gång det lyckas (idempotent DELETE).
    } finally {
      setIsMuting(false)
      onClose()
    }
  }

  return (
    <Overlay
      onClose={onClose}
      ariaLabel="Notiser"
      maxWidth={360}
      zIndex="var(--z-overlay)"
      backdropStyle={{ alignItems: 'flex-start', padding: '44px 16px 20px', overflowY: 'auto' }}
    >
      <div style={{
        background: 'var(--bg)',
        borderRadius: 'var(--radius-md)',
        maxWidth: 360, width: '100%',
        maxHeight: 'calc(100vh - 64px)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-modal)',
      }}>
        {/* Läder-header-band */}
        <div style={{
          background: 'var(--bg-leather)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 800,
              color: 'var(--text-light)', margin: 0, lineHeight: 1.2,
            }}>Notiser</p>
            <p style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 8,
              letterSpacing: '1.5px', color: 'var(--text-light-secondary)',
              margin: '3px 0 0',
            }}>{clubLabel}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 20,
              color: 'var(--text-light-secondary)', cursor: 'pointer',
              padding: '0 0 0 12px', flexShrink: 0,
            }}
            aria-label="Stäng"
          >×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-surface)', padding: '16px 18px 18px' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13,
            lineHeight: 1.5, margin: '0 0 16px', color: 'var(--text-muted)',
          }}>
            Vad vill du att vi hör av oss om? Och när ska vi hålla tyst?
          </p>

          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 8, fontWeight: 600, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8,
          }}>Vad vi hör av oss om</div>
          <div className="card-sharp" style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            {CATEGORY_ROWS.map((row, i) => (
              <div key={row.key} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', minHeight: 44,
                borderBottom: i < CATEGORY_ROWS.length - 1 ? '1px solid var(--border)' : undefined,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.4, marginTop: 2, color: 'var(--text-muted)' }}>{row.description}</div>
                </div>
                <ToggleSwitch
                  on={prefs.categories[row.key]}
                  onChange={() => toggleCategory(row.key)}
                  ariaLabel={`${row.label}-notiser`}
                />
              </div>
            ))}
          </div>

          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 8, fontWeight: 600, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--text-muted)', margin: '18px 0 8px',
          }}>Tysta timmar</div>
          <div className="card-sharp" style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 5,
                }}>Från</div>
                <label style={{
                  display: 'block', fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
                  color: 'var(--text-primary)', border: '1px solid var(--border-dark)',
                  borderRadius: 'var(--radius-sm)', padding: '6px 14px', background: 'var(--bg-surface)',
                  cursor: 'pointer', position: 'relative',
                }}>
                  {timeDisplay(prefs.quietHours.startHour, prefs.quietHours.startMinute)}
                  <input
                    type="time"
                    aria-label="Tysta timmar, från"
                    value={timeInputValue(prefs.quietHours.startHour, prefs.quietHours.startMinute)}
                    onChange={e => setQuietHour('start', e.target.value)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </label>
              </div>
              <div style={{ width: 16, height: 1, background: 'var(--border-dark)', marginTop: 22 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: 'var(--text-muted)', marginBottom: 5,
                }}>Till</div>
                <label style={{
                  display: 'block', fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
                  color: 'var(--text-primary)', border: '1px solid var(--border-dark)',
                  borderRadius: 'var(--radius-sm)', padding: '6px 14px', background: 'var(--bg-surface)',
                  cursor: 'pointer', position: 'relative',
                }}>
                  {timeDisplay(prefs.quietHours.endHour, prefs.quietHours.endMinute)}
                  <input
                    type="time"
                    aria-label="Tysta timmar, till"
                    value={timeInputValue(prefs.quietHours.endHour, prefs.quietHours.endMinute)}
                    onChange={e => setQuietHour('end', e.target.value)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.45, textAlign: 'center', margin: '12px 0 0', color: 'var(--text-muted)' }}>
              Mellan de här tiderna hör du aldrig av oss.
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 14, padding: '11px 13px',
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
            <p style={{
              fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12,
              lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0,
            }}>
              Vi skickar högst en om dagen.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '18px 0 14px' }} />

          {!confirmingMute ? (
            <button
              onClick={() => setConfirmingMute(true)}
              style={{
                width: '100%', minHeight: 44, background: 'none',
                border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >Tysta</button>
          ) : (
            <div className="card-sharp" style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-dark)',
              borderRadius: 'var(--radius-md)', padding: 14,
            }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                color: 'var(--text-primary)', margin: '0 0 6px',
              }}>Klubben tystnar.</p>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                Inga fler notiser. Allt om den här installationen raderas hos oss.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setConfirmingMute(false)}
                  disabled={isMuting}
                  style={{
                    flex: 1, minHeight: 44, background: 'none', border: '1px solid var(--border-dark)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 13,
                    fontWeight: 600, cursor: isMuting ? 'default' : 'pointer', fontFamily: 'var(--font-body)',
                  }}
                >Avbryt</button>
                <button
                  className="btn btn-danger"
                  onClick={() => { void confirmMute() }}
                  disabled={isMuting}
                  style={{
                    flex: 1, fontSize: 13,
                  }}
                >{isMuting ? '…' : 'Tysta'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}
