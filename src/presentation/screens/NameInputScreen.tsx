import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function NameInputScreen() {
  const navigate = useNavigate()
  const [managerName, setManagerName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  const VALID_NAME = /^[a-zA-ZåäöÅÄÖ0-9\s\-']*$/
  const isNameValid = (n: string) => n.trim().length > 0 && VALID_NAME.test(n)

  function capitalizeName(name: string): string {
    return name.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  }

  const tryAdvance = () => {
    if (!isNameValid(managerName)) {
      if (!managerName.trim()) return
      setNameError('Namnet får bara innehålla bokstäver, siffror, bindestreck och apostrof.')
      return
    }
    setNameError(null)
    navigate('/club-selection', { state: { managerName: capitalizeName(managerName.trim()) } })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        background: 'var(--bg-dark)',
        borderBottom: '2px solid var(--accent)',
        flexShrink: 0,
        minHeight: 44,
        position: 'relative',
      }}>
        <img
          src="/bandymanager-logo.png"
          alt="Bandy Manager"
          style={{ height: 26, width: 'auto', opacity: 0.85 }}
        />
        <span style={{
          color: 'var(--text-light)', fontSize: 11, letterSpacing: 3,
          textTransform: 'uppercase', fontFamily: 'var(--font-body)', fontWeight: 600,
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          NYTT SPEL
        </span>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '4px',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 24,
        }}>
          NYTT UPPDRAG
        </p>
        <h2 style={{
          fontSize: 28, fontWeight: 400, color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)', letterSpacing: '2px',
          textTransform: 'uppercase', marginBottom: 16, textAlign: 'center',
        }}>
          VEM ÄR DU?
        </h2>
        <p style={{
          fontSize: 13, fontFamily: 'var(--font-display)', fontStyle: 'italic',
          color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6,
          marginBottom: 24, maxWidth: 280,
        }}>
          Bandyn behöver folk som dig. Som ställer upp en regnig tisdagkväll i december. Som vet att en hörna i 87:e kan vända allt.
        </p>
        <input
          autoFocus
          type="text"
          value={managerName}
          onChange={e => { setManagerName(e.target.value); if (nameError) setNameError(null) }}
          onKeyDown={e => e.key === 'Enter' && tryAdvance()}
          placeholder="Ditt namn"
          maxLength={40}
          style={{
            width: '100%', maxWidth: 300, padding: '12px 4px',
            background: 'transparent', border: 'none',
            borderBottom: '2px solid rgba(196,122,58,0.5)',
            color: 'var(--accent)', fontSize: 22, fontWeight: 700,
            outline: 'none', textAlign: 'center', letterSpacing: '1px',
          }}
        />
        {nameError && (
          <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, textAlign: 'center', maxWidth: 300 }}>
            {nameError}
          </p>
        )}
      </div>

      <div style={{ padding: '20px 32px', paddingBottom: 'calc(20px + var(--safe-bottom))' }}>
        <button
          onClick={tryAdvance}
          disabled={!managerName.trim()}
          className="btn btn-copper"
          style={{
            width: '100%', padding: '16px 24px', fontSize: 14,
            letterSpacing: '3px', textTransform: 'uppercase',
            opacity: isNameValid(managerName) ? 1 : 0.35,
            cursor: isNameValid(managerName) ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
          }}
        >
          GÅ VIDARE →
        </button>
      </div>

      <footer style={{
        height: 40, background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>BURY FEN</span>
      </footer>
    </div>
  )
}
