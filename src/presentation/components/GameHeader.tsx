import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Settings } from 'lucide-react'
import { useGameStore, useManagedClub, useUnreadInboxCount } from '../store/gameStore'
import { saveSaveGame } from '../../infrastructure/persistence/saveGameStorage'

export function GameHeader() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const club = useManagedClub()
  const unreadInbox = useUnreadInboxCount()
  const [showMenu, setShowMenu] = useState(false)
  const [saveToast, setSaveToast] = useState(false)
  if (!game || !club) return null

  const lastPlayedRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const nextLeagueFixture = game.fixtures
    .filter(f => f.status === 'scheduled' && !f.isCup)
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]
  const currentRound = nextLeagueFixture ? nextLeagueFixture.roundNumber : lastPlayedRound

  const [showHelp, setShowHelp] = useState(false)

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      padding: '10px 12px',
      background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0,
      minHeight: 44,
    }}>
      {/* Left: logo */}
      <img
        src="/bandymanager-logo.png"
        alt="Bandy Manager"
        style={{ height: 26, width: 'auto', opacity: 0.85 }}
      />

      {/* Center: club + season */}
      <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
        <p style={{
          fontSize: 12,
          color: 'rgba(245,241,235,0.85)',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {club.shortName ?? club.name}
        </p>
        <p style={{
          fontSize: 9,
          color: 'rgba(245,241,235,0.55)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {game.managerName} · {game.currentSeason}/{game.currentSeason + 1}
          {currentRound > 0 ? ` · Omg ${currentRound}` : ''}
        </p>
      </div>

      {/* Right: inbox + menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => navigate('/game/inbox')}
          style={{
            position: 'relative',
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: unreadInbox > 0 ? 'var(--accent)' : 'rgba(245,241,235,0.5)',
          }}
        >
          <Bell size={18} strokeWidth={2} />
          {unreadInbox > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -4,
              minWidth: 14, height: 14, borderRadius: 99,
              background: 'var(--danger)', color: 'var(--text-light)',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--bg-dark)',
            }}>
              {unreadInbox > 9 ? '9+' : unreadInbox}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(245,241,235,0.5)',
          }}
        >
          <Settings size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Save toast */}
      {saveToast && (
        <div style={{
          position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--success)', color: 'var(--text-light)',
          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 201,
        }}>
          ✓ Sparat
        </div>
      )}

      {/* Settings dropdown */}
      {showMenu && (
        <div style={{
          position: 'absolute', top: 48, right: 12,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '4px 0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 200, minWidth: 160,
        }}>
          {[
            { label: '💾 Spara spel', action: () => {
              const currentGame = useGameStore.getState().game
              if (currentGame) saveSaveGame(currentGame)
              setSaveToast(true); setTimeout(() => setSaveToast(false), 2000)
            } },
            { label: '📂 Ladda spel', action: () => navigate('/') },

            { label: '📖 Spelguide', action: () => setShowHelp(true) },
          ].map((item, i) => (
            <button key={i} onClick={() => { item.action(); setShowMenu(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', background: 'none', border: 'none',
                fontSize: 13, color: 'var(--text-primary)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Spelguide overlay */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: 60, overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg)', borderRadius: 12, padding: '20px 18px',
              maxWidth: 380, width: '90%', maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>Spelguide</h2>
              <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
            </div>

            {[
              { section: '🏁 Komma igång' },
              { q: 'Hur vinner jag?', a: 'Säsongen består av 22 ligaomgångar. De åtta bästa går till slutspel (bäst av 5). Vinnaren av slutspelet blir Svenska Mästare. Dessutom spelas Svenska Cupen parallellt.' },
              { q: 'Dashen', a: 'Visar nästa match, tabellposition, ekonomi och bygdens puls. Den stora knappen längst ner tar dig vidare till nästa omgång eller match.' },
              { q: 'Trupp', a: 'Alla spelare med form, fitness och styrka. Klicka på en spelare för detaljer, kontraktsförlängning eller spelarsamtal.' },
              { q: 'Match', a: 'Välj 11 startspelare, sätt taktik (mentalitet, tempo, press) och spela live eller snabbsimulera.' },
              { q: 'Onboarding-tips', a: 'De första omgångarna visas tips om lineup, träning, styrelsen, orten och mer. Tipsen kan stängas med krysset.' },
              { section: '🏆 Tävling' },
              { q: 'Ligaspel', a: '22 omgångar, alla möts två gånger. 2 poäng för vinst, 1 för oavgjort. Topp 8 till slutspel.' },
              { q: 'Slutspel', a: 'Kvartsfinal, semifinal och final spelas i bäst av 5. Högst placerad lag har hemmaplansfördel.' },
              { q: 'Svenska Cupen', a: 'Cupmatcher inflikas mellan ligarunder. Förstarunda, kvartsfinal, semifinal och final. Vinst ger bonus och prestige.' },
              { q: 'Bandy vs fotboll', a: '2 poäng för vinst (inte 3). 10 min utvisning (inga kort). Hörnor är centralt offensivt vapen. Flygande byten. Spelas på is utomhus oktober–mars.' },
              { q: 'Väder och underlag', a: 'Snö straffar bollkontroll. Dimma försvårar bredd. Töväder ökar skaderisk. Kyla ger hård, snabb is.' },
              { section: '💰 Ekonomi & Orten' },
              { q: 'Klubbekonomi', a: 'Sponsorer, matchintäkter och föreningsaktiviteter. Löner är största kostnaden. Håll kassan positiv — licensnämnden granskar vid säsongsslut.' },
              { q: 'Mecenater', a: 'Lokala stöttepelare som bidrar ekonomiskt. Deras humör påverkas av resultat och uppmärksamhet. Besök Orten-tabben för detaljer.' },
              { q: 'Kommun och bidrag', a: 'Lokal ställning (0–100) påverkar hemmaplansfördel, sponsorintresse och kommunbidrag. Bygg relationen via Orten-fliken.' },
              { q: 'Föreningsaktiviteter', a: 'Kiosk, lotteri, bandyskola och mer. Startas under Ekonomi-tabben och ger löpande intäkter.' },
              { q: 'Licensnämnden', a: 'Granskar ekonomin varje säsong. Negativ kassa eller svag ungdomsverksamhet kan ge varning som skrämmer sponsorer.' },
              { section: '👥 Trupp & Transfers' },
              { q: 'Transfers', a: 'Scouta spelare, lägg bud, förhandla. Transferfönstret är öppet under försäsongen och vintern. Max 3 samtidiga bud.' },
              { q: 'Scouting', a: 'Tre system: talangspaning hittar nya spelare, utvärdering ger attribut, motståndaranalys inför match. Budget: 10 ronder per säsong, köp fler under Ekonomi.' },
              { q: 'Kontrakt', a: 'Spelare med utgående kontrakt kan lämna gratis. Förläng i tid via spelarkortet. Lönebudgeten varnar men blockerar aldrig.' },
              { q: 'Dubbelliv', a: 'De flesta spelare jobbar vid sidan av bandyn. Flexibilitet påverkar träning. Heltidsproffs kostar mer men tränar bättre.' },
              { q: 'Ungdomsakademin', a: 'Varje säsong kan lovande ungdomar dyka upp. Utveckla dem i akademin och lyft upp till A-laget när de är redo.' },
              { section: '⚙️ Tips' },
              { q: 'Träning', a: 'Välj fokus (fysik, teknik, taktik) och intensitet. Hård träning ger snabbare utveckling men högre skaderisk. Träningsprojekt ger riktade lyft.' },
              { q: 'Styrelsen', a: 'Styrelsen sätter säsongsmål. Resultat under förväntan sänker tålamodet. Uppfyll mål för att behålla jobbet och få bättre budget.' },
              { q: 'Spara ofta', a: 'Spara via kugghjulet uppe till höger. Spelet autosparar inte — en missad sparning kan kosta en hel säsong.' },
            ].map((item, i) => (
              'section' in item && item.section ? (
                <p key={i} style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: 'var(--accent)', marginTop: i > 0 ? 16 : 0, marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                  {item.section}
                </p>
              ) : (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.q}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.a}</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
