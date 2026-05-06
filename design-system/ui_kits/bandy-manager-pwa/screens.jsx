const { useState: useMatchState } = React;

/* ── MATCH / TAKTIK screen ──────────────────────────────── */
function MatchScreen({ onPlay }) {
  const [tactic, setTactic] = useMatchState('balanced');
  const tactics = [
    { id: 'defensive', label: 'Defensiv', desc: 'Håll 0.' },
    { id: 'balanced',  label: 'Balanserad', desc: 'Taktiskt neutralt.' },
    { id: 'offensive', label: 'Offensiv', desc: 'Jaga mål.' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '10px 12px 140px' }}>
      <CardRound style={{ marginBottom: 10 }}>
        <SectionLabel emoji="🎤">PEP-TALK · FÖRE MATCH</SectionLabel>
        <p className="h-quote" style={{ margin: 0 }}>
          "Spelarna är tysta i omklädningsrummet. Holmgren spottar i handen och ser upp."
        </p>
      </CardRound>

      <SectionLabel emoji="🏒">TAKTIK</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        {tactics.map(t => (
          <div key={t.id} onClick={() => setTactic(t.id)} style={{
            padding: '10px 8px', borderRadius: 8,
            border: tactic === t.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
            background: tactic === t.id ? 'rgba(196,122,58,0.06)' : 'var(--bg-surface)',
            cursor: 'pointer', textAlign: 'center',
            boxShadow: tactic === t.id ? '0 0 0 3px rgba(196,122,58,0.08)' : 'var(--shadow-card)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: tactic === t.id ? 'var(--accent-dark)' : 'var(--text-primary)' }}>
              {t.label}
            </p>
            <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '3px 0 0' }}>{t.desc}</p>
          </div>
        ))}
      </div>

      <SectionLabel emoji="👥">UPPSTÄLLNING</SectionLabel>
      <CardSharp style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
        {/* Pitch */}
        <div style={{
          height: 180, background: 'linear-gradient(180deg, #D0D4D8, #E0E4E8)',
          position: 'relative',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 18px)',
        }}>
          {/* Circle center */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: 50, height: 50, borderRadius: '50%', border: '1px solid rgba(126,179,212,0.5)' }}/>
          {/* Players — 1-3-4-3 bandy formation */}
          {[
            { x: 50, y: 92, l: 'MV' },
            { x: 20, y: 72, l: 'B' }, { x: 50, y: 72, l: 'B' }, { x: 80, y: 72, l: 'B' },
            { x: 15, y: 48, l: 'YH' }, { x: 40, y: 52, l: 'MF' }, { x: 60, y: 52, l: 'MF' }, { x: 85, y: 48, l: 'YH' },
            { x: 30, y: 22, l: 'A' }, { x: 50, y: 18, l: 'A' }, { x: 70, y: 22, l: 'A' },
          ].map((p, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)',
              width: 22, height: 22, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #1e4d8c, #0a2a55)',
              color: '#F5F1EB', fontSize: 8, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--accent)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-body)',
            }}>{p.l}</div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
          <span style={{ color: 'var(--text-secondary)' }}>1–3–4–3 · klassisk</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Byt formation ›</span>
        </div>
      </CardSharp>

      <SectionLabel emoji="🩹">SKADERAPPORT</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4A0080,#2a0050)', color: '#F5F1EB', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>EH</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>Edvin Hökerberg</p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '2px 0 0' }}>MF · ljumskskada · 2 omg kvar</p>
          </div>
          <Tag variant="red">UTE</Tag>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#5a2d7a,#3a1a58)', color: '#F5F1EB', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>TL</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>Tobias Lindblom</p>
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '2px 0 0' }}>YH · förkylning · tvekar</p>
          </div>
          <Tag variant="copper">TVEKAR</Tag>
        </div>
      </div>
    </div>
  );
}

/* ── MATCH RESULT / GRANSKA ──────────────────────────────── */
function ResultScreen({ onBack }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: 0 }}>
      {/* Hero — leather bar */}
      <div style={{
        background: 'linear-gradient(180deg, #3D3A32, #2A2820)',
        padding: '20px 16px 24px',
        color: 'var(--text-light)',
        textAlign: 'center',
        borderBottom: '2px solid var(--accent)',
        position: 'relative',
      }}>
        <p style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--match-gold)', margin: 0 }}>
          SLUTRESULTAT · OMG 14
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14 }}>
          <div style={{ textAlign: 'center' }}>
            <ClubBadge club="forsbacka" size={44}/>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, margin: '4px 0 0', color: 'var(--text-light)' }}>Forsbacka</p>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800, letterSpacing: 2, color: 'var(--text-light)' }}>
            4<span style={{ color: 'var(--match-gold)', margin: '0 6px' }}>–</span>2
          </div>
          <div style={{ textAlign: 'center', opacity: 0.75 }}>
            <ClubBadge club="skutskar" size={44}/>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, margin: '4px 0 0', color: 'rgba(245,241,235,0.7)' }}>Skutskär</p>
          </div>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'rgba(245,241,235,0.65)', margin: '14px 0 0' }}>
          "Klacken sjunger i kylan."
        </p>
      </div>

      <div style={{ padding: '14px 12px 120px' }}>
        <SectionLabel emoji="📈">MÅLSKYTTAR</SectionLabel>
        <CardSharp style={{ padding: 0, marginBottom: 10 }}>
          {[
            { p: 'Holmgren', min: 12, home: true, note: 'passning: Svensson' },
            { p: 'Holmgren', min: 28, home: true, note: 'straff' },
            { p: 'Eriksson (Skutskär)', min: 41, home: false, note: 'hörna' },
            { p: 'Nilsson', min: 62, home: true, note: 'passning: Holmgren' },
            { p: 'Björk (Skutskär)', min: 74, home: false, note: 'soloruscher' },
            { p: 'Svensson', min: 88, home: true, note: 'kontring' },
          ].map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, width: 28,
                color: g.home ? 'var(--accent-dark)' : 'var(--ice-dark)' }}>{g.min}'</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{g.p}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{g.note}</p>
              </div>
              <span style={{ fontSize: 14 }}>{g.home ? '🏒' : '·'}</span>
            </div>
          ))}
        </CardSharp>

        <SectionLabel emoji="⭐">MATCHENS MAN</SectionLabel>
        <div style={{ display: 'flex', gap: 10, padding: 12, background: 'var(--bg-surface)',
          border: '1.5px solid rgba(196,122,58,0.4)', borderRadius: 8, marginBottom: 10,
          boxShadow: '0 0 0 4px rgba(196,122,58,0.06)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'radial-gradient(circle at 35% 35%, #1e4d8c, #0a2a55)', color: '#F5F1EB',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--accent)', fontFamily: 'var(--font-display)' }}>HH</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Henrik Holmgren</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>A · 2 mål + 1 passning</p>
            <div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
              <span className="h-label">BETYG</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--accent-dark)' }}>9.2</span>
            </div>
          </div>
        </div>

        <SectionLabel emoji="📰">RAPPORTEN</SectionLabel>
        <CardRound>
          <p className="h-quote" style={{ margin: 0 }}>
            "Forsbacka IF gav bruksorten en kväll att minnas. Holmgren fortsatte sin målskytteform och Skutskär föll trots sen reducering. Publiken dröjde kvar — man sjöng fortfarande när kylan kröp in."
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '8px 0 0', textAlign: 'right' }}>
            — Gefle Bandy-Kuriren
          </p>
        </CardRound>
      </div>
    </div>
  );
}

Object.assign(window, { MatchScreen, ResultScreen });
