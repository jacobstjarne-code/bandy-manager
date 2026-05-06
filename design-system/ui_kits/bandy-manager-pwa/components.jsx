/* Bandy Manager UI Kit components — shared global JSX via window.* */
const { useState } = React;

const BM_CLUBS = {
  forsbacka:  { primary: '#1e4d8c', secondary: '#C47A3A', symbol: 'hammer', name: 'Forsbacka', short: 'FBK' },
  soderfors:  { primary: '#1a237e', secondary: '#E8D080', symbol: 'star',   name: 'Söderfors', short: 'SFS' },
  vastanfors: { primary: '#006400', secondary: '#FFFFFF', symbol: 'crown',  name: 'Västanfors', short: 'VFS' },
  karlsborg:  { primary: '#8B0000', secondary: '#FFFFFF', symbol: 'river',  name: 'Karlsborg', short: 'KLB' },
  malilla:    { primary: '#4A0080', secondary: '#C47A3A', symbol: 'shield', name: 'Målilla',   short: 'MAL' },
  gagnef:     { primary: '#CC0000', secondary: '#FFFFFF', symbol: 'mountain', name: 'Gagnef',  short: 'GAG' },
  halleforsnas:{primary: '#2E7D32', secondary: '#FFFFFF', symbol: 'elk',    name: 'Hälleforsnäs', short: 'HFS' },
  lesjofors:  { primary: '#FF6600', secondary: '#000000', symbol: 'axe',    name: 'Lesjöfors', short: 'LSJ' },
  rogle:      { primary: '#333333', secondary: '#C47A3A', symbol: 'tower',  name: 'Rögle',     short: 'RGL' },
  slottsbron: { primary: '#0066CC', secondary: '#FFFFFF', symbol: 'wave',   name: 'Slottsbron', short: 'SLB' },
  skutskar:   { primary: '#006633', secondary: '#E8D080', symbol: 'tree',   name: 'Skutskär',  short: 'SKU' },
  heros:      { primary: '#990000', secondary: '#FFFFFF', symbol: 'bear',   name: 'Heros',     short: 'HRS' },
};

const SHIELD = 'M32 2 L58 12 V32 C58 46 46 54 32 60 C18 54 6 46 6 32 V12 Z';

function BadgeSymbol({ symbol, secondary, primary }) {
  switch (symbol) {
    case 'hammer':
      return (<>
        <rect x="28" y="18" width="8" height="20" rx="2" fill={secondary} opacity="0.9" transform="rotate(-40 32 32)"/>
        <rect x="20" y="14" width="14" height="7" rx="2" fill={secondary} transform="rotate(-40 32 32)"/>
        <rect x="28" y="18" width="8" height="20" rx="2" fill={secondary} opacity="0.7" transform="rotate(40 32 32)"/>
        <rect x="20" y="14" width="14" height="7" rx="2" fill={secondary} opacity="0.7" transform="rotate(40 32 32)"/>
      </>);
    case 'star':
      return <polygon points="32,14 35.5,24.5 47,24.5 37.5,30.5 41,41 32,35 23,41 26.5,30.5 17,24.5 28.5,24.5" fill={secondary}/>;
    case 'crown':
      return (<>
        <path d="M18,38 L18,24 L24,30 L32,18 L40,30 L46,24 L46,38 Z" fill={secondary}/>
        <rect x="18" y="38" width="28" height="6" rx="1" fill={secondary}/>
      </>);
    case 'river':
      return (<>
        <path d="M16,26 Q22,22 28,26 Q34,30 40,26 Q46,22 50,26" stroke={secondary} strokeWidth="2.5" fill="none"/>
        <path d="M16,33 Q22,29 28,33 Q34,37 40,33 Q46,29 50,33" stroke={secondary} strokeWidth="2.5" fill="none"/>
        <path d="M16,40 Q22,36 28,40 Q34,44 40,40 Q46,36 50,40" stroke={secondary} strokeWidth="2.5" fill="none"/>
      </>);
    case 'tree':
      return (<>
        <rect x="29" y="40" width="6" height="8" fill={secondary}/>
        <polygon points="32,14 22,32 42,32" fill={secondary}/>
        <polygon points="32,20 20,40 44,40" fill={secondary} opacity="0.9"/>
      </>);
    case 'shield':
      return <path d="M32,14 L46,20 L46,34 Q46,44 32,50 Q18,44 18,34 L18,20 Z" fill={secondary}/>;
    default:
      return <circle cx="32" cy="32" r="10" fill={secondary}/>;
  }
}

function ClubBadge({ club, size = 40 }) {
  const c = BM_CLUBS[club] || BM_CLUBS.forsbacka;
  const id = `bg-${club}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <radialGradient id={id} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={c.primary} stopOpacity="1"/>
          <stop offset="100%" stopColor={c.primary} stopOpacity="0.7"/>
        </radialGradient>
      </defs>
      <path d={SHIELD} fill={`url(#${id})`}/>
      <BadgeSymbol symbol={c.symbol} secondary={c.secondary} primary={c.primary}/>
      <path d={SHIELD} fill="none" stroke="rgba(196,122,58,0.5)" strokeWidth="1.5"/>
    </svg>
  );
}

function SectionLabel({ emoji, children, right, style }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, ...style }}>
      <p className="h-label" style={{ margin: 0 }}>{emoji ? emoji + ' ' : ''}{children}</p>
      {right}
    </div>
  );
}

function Chev() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 16, height: 16, borderRadius: 4, border: '1px solid var(--border)',
      color: 'var(--accent)', fontSize: 11, flexShrink: 0,
    }}>›</span>
  );
}

function CardSharp({ children, style, onClick }) {
  return (
    <div onClick={onClick} className="card-sharp" style={{
      borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)',
      padding: '10px 12px', boxShadow: 'var(--shadow-card)', cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

function CardRound({ children, style }) {
  return (
    <div style={{
      borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)',
      padding: '10px 12px', boxShadow: 'var(--shadow-card)', ...style,
    }}>{children}</div>
  );
}

function RowCard({ emoji, label, value, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 8, boxShadow: 'var(--shadow-card)', cursor: 'pointer', marginBottom: 4,
    }}>
      <p className="h-label" style={{ margin: 0, flexShrink: 0 }}>{emoji} {label}</p>
      <p style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{value}</p>
      <Chev/>
    </div>
  );
}

function Tag({ variant = 'ghost', children, style }) {
  const styles = {
    fill:    { background: 'var(--accent)', color: '#fff', border: 'none' },
    copper:  { background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent-dark)' },
    green:   { background: 'rgba(90,154,74,0.12)', border: '1px solid rgba(90,154,74,0.3)', color: 'var(--success-light)' },
    red:     { background: 'rgba(176,80,64,0.10)', border: '1px solid rgba(176,80,64,0.25)', color: 'var(--danger-text)' },
    ice:     { background: 'rgba(126,179,212,0.12)', border: '1px solid rgba(126,179,212,0.3)', color: 'var(--ice-dark)' },
    ghost:   { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' },
    dark:    { background: 'rgba(255,255,255,0.1)', color: 'var(--text-light-secondary)', border: 'none' },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      borderRadius: 99, padding: '2px 8px',
      fontSize: 9, fontWeight: 600, letterSpacing: 0.4,
      textTransform: 'uppercase', whiteSpace: 'nowrap',
      ...styles, ...style,
    }}>{children}</span>
  );
}

function FormDots({ results }) {
  const COLORS = { V: 'var(--success)', F: 'var(--danger)', O: 'var(--accent)' };
  return (
    <div style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: results[i] ? COLORS[results[i]] : 'var(--border)',
        }}/>
      ))}
    </div>
  );
}

function DiamondDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--border-dark))' }}/>
      <svg viewBox="0 0 28 12" width="28" height="12">
        <polygon points="14,1 27,6 14,11 1,6" fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.4"/>
        <polygon points="14,4 20,6 14,8 8,6" fill="var(--accent)" opacity="0.15"/>
      </svg>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border-dark), transparent)' }}/>
    </div>
  );
}

function CtaButton({ children, onClick, disabled, variant = 'primary' }) {
  const primaryBg =
    'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 50%),' +
    'linear-gradient(to bottom, #DD9555, #8B4820)';
  const style = variant === 'primary'
    ? { background: primaryBg, color: '#fff', boxShadow: 'var(--shadow-primary)' }
    : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-dark)' };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '14px 16px', fontSize: 14, fontWeight: 700,
      letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-body)',
      border: 'none', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1, ...style,
    }}>{children}</button>
  );
}

function GameHeader({ club = 'forsbacka', manager = 'J. Stjärne', round = 14 }) {
  const c = BM_CLUBS[club];
  return (
    <div style={{
      padding: '10px 12px', background: 'var(--bg-dark)',
      borderBottom: '2px solid var(--accent)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      minHeight: 44, position: 'relative', flexShrink: 0,
    }}>
      <img src="../../assets/bandymanager-logo.png" alt="Bandy Manager"
        style={{ height: 26, opacity: 0.85 }}/>
      <div style={{ textAlign: 'center', flex: 1, padding: '0 8px' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(245,241,235,0.85)',
          fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.2 }}>{c.name.toUpperCase()} IF</p>
        <p style={{ fontSize: 9, color: 'rgba(245,241,235,0.55)', margin: 0, lineHeight: 1.2 }}>
          {manager} · 2026/2027 · Omg {round}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ position: 'relative', color: 'var(--accent)', fontSize: 17 }}>
          🔔
          <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8,
            borderRadius: '50%', background: 'var(--danger)', border: '1.5px solid var(--bg-dark)' }}/>
        </span>
        <span style={{ color: 'rgba(245,241,235,0.5)', fontSize: 14, marginLeft: 2 }}>⚙</span>
      </div>
    </div>
  );
}

function PhaseIndicator({ phase = 'prepare' }) {
  const phases = [
    { id: 'prepare', label: 'Förbered' },
    { id: 'play',    label: 'Spela' },
    { id: 'review',  label: 'Granska' },
  ];
  const activeIdx = phases.findIndex(p => p.id === phase);
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 20px 8px', background: 'var(--bg-dark)' }}>
      {phases.map((p, i) => {
        const isActive = i === activeIdx;
        const isPast = i < activeIdx;
        const dotBg = isPast ? 'var(--accent)' : isActive ? 'rgba(139,115,50,0.3)' : 'transparent';
        const border = isPast || isActive ? '1.5px solid var(--accent)' : '1.5px solid rgba(255,255,255,0.2)';
        const color = isPast || isActive ? 'var(--accent)' : 'rgba(255,255,255,0.35)';
        return (
          <React.Fragment key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotBg, border,
                boxShadow: isActive ? '0 0 0 3px rgba(139,115,50,0.1)' : 'none' }}/>
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400,
                letterSpacing: 0.8, textTransform: 'uppercase', color }}>{p.label}</span>
            </div>
            {i < phases.length - 1 && (
              <div style={{ flex: '0 0 20px', height: 1.5, margin: '0 2px',
                background: i < activeIdx ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function BottomNav({ active = 'hem', onNav }) {
  const tabs = [
    { id: 'hem', label: 'Hem', icon: '🏠' },
    { id: 'trupp', label: 'Trupp', icon: '👥' },
    { id: 'match', label: 'Match', icon: '⚔️' },
    { id: 'tabell', label: 'Tabell', icon: '📊' },
    { id: 'transfers', label: 'Transfers', icon: '↔️' },
    { id: 'klubb', label: 'Klubb', icon: '🏛️' },
  ];
  return (
    <div style={{
      display: 'flex', height: 'var(--bottom-nav-height)',
      background: 'var(--bg-surface)',
      backgroundImage: 'repeating-linear-gradient(92deg, rgba(160,130,90,0.04) 0px, rgba(160,130,90,0.02) 2px, transparent 2px, transparent 8px)',
      borderTop: '1.5px solid var(--border)',
      paddingBottom: 'var(--safe-bottom)',
      flexShrink: 0,
    }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        return (
          <div key={t.id} onClick={() => onNav && onNav(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 9, fontWeight: isActive ? 700 : 500, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 18, filter: isActive ? 'none' : 'grayscale(0.3) opacity(0.7)' }}>{t.icon}</span>
            <span>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  BM_CLUBS, ClubBadge, SectionLabel, Chev, CardSharp, CardRound, RowCard,
  Tag, FormDots, DiamondDivider, CtaButton, GameHeader, PhaseIndicator, BottomNav,
});
