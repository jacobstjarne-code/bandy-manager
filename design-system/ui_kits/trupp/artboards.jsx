/* Trupp-skärmen för Bandy Manager.
 * Två lägen: Lista (default, tät) och Plan (formation 1-3-2-4-1).
 * Gruppera på position: MV → B → YH → MF → A. Sortera på form inom grupp.
 * Filter-rad: Alla / Skadade / Kontrakt går ut / U21.
 * Tre primära actions per spelarrad: Elva-toggle, Förläng (om kontrakt går ut), Stats.
 */

const { useState, useMemo } = React;

/* ───────────────────────── Trupp-data (mock) ───────────────────────── */

const POS_ORDER = ['MV', 'B', 'YH', 'MF', 'A'];
const POS_LABEL = {
  MV: 'Målvakt',
  B:  'Backar',
  YH: 'Halvbackar',
  MF: 'Mittfältare',
  A:  'Anfallare',
};

// 22 spelare, baserat på Forsbacka som default-klubb
const SQUAD = [
  // MV (2)
  { id: 1, num: 1, name: 'Erik Lundberg',     pos: 'MV', age: 31, form: 84, status: 'redo',    contractEnd: 2027, salaryKr: 38000, moral: 78, u21: false },
  { id: 2, num: 25, name: 'Jakob Hedström',   pos: 'MV', age: 23, form: 71, status: 'redo',    contractEnd: 2026, salaryKr: 22000, moral: 65, u21: false },

  // B (3)
  { id: 3, num: 4,  name: 'Anders Berg',      pos: 'B', age: 29, form: 79, status: 'redo',    contractEnd: 2027, salaryKr: 32000, moral: 72, u21: false },
  { id: 4, num: 5,  name: 'Mats Eriksson',    pos: 'B', age: 33, form: 76, status: 'skadad',  contractEnd: 2026, salaryKr: 30000, moral: 60, u21: false, injuryDays: 12 },
  { id: 5, num: 6,  name: 'Daniel Persson',   pos: 'B', age: 26, form: 81, status: 'redo',    contractEnd: 2028, salaryKr: 35000, moral: 80, u21: false },

  // YH (4)
  { id: 6, num: 2,  name: 'Lukas Sjögren',    pos: 'YH', age: 24, form: 88, status: 'redo',    contractEnd: 2027, salaryKr: 34000, moral: 84, u21: false },
  { id: 7, num: 3,  name: 'Pontus Nilsson',   pos: 'YH', age: 28, form: 75, status: 'redo',    contractEnd: 2026, salaryKr: 31000, moral: 68, u21: false },
  { id: 8, num: 14, name: 'Hampus Karlsson',  pos: 'YH', age: 21, form: 82, status: 'redo',    contractEnd: 2026, salaryKr: 24000, moral: 75, u21: true },
  { id: 9, num: 15, name: 'Oscar Lind',       pos: 'YH', age: 27, form: 70, status: 'bänken',  contractEnd: 2027, salaryKr: 28000, moral: 55, u21: false },

  // MF (8)
  { id: 10, num: 7,  name: 'Filip Andersson', pos: 'MF', age: 25, form: 90, status: 'redo',    contractEnd: 2028, salaryKr: 42000, moral: 88, u21: false },
  { id: 11, num: 8,  name: 'Marcus Olofsson', pos: 'MF', age: 30, form: 86, status: 'redo',    contractEnd: 2027, salaryKr: 40000, moral: 82, u21: false },
  { id: 12, num: 9,  name: 'Viktor Engström', pos: 'MF', age: 22, form: 83, status: 'redo',    contractEnd: 2026, salaryKr: 26000, moral: 78, u21: false },
  { id: 13, num: 10, name: 'Simon Forsberg',  pos: 'MF', age: 27, form: 80, status: 'redo',    contractEnd: 2027, salaryKr: 36000, moral: 74, u21: false },
  { id: 14, num: 11, name: 'Theo Wallin',     pos: 'MF', age: 19, form: 76, status: 'redo',    contractEnd: 2027, salaryKr: 18000, moral: 70, u21: true },
  { id: 15, num: 16, name: 'Albin Holm',      pos: 'MF', age: 24, form: 73, status: 'redo',    contractEnd: 2026, salaryKr: 27000, moral: 62, u21: false },
  { id: 16, num: 17, name: 'Gustav Strand',   pos: 'MF', age: 32, form: 78, status: 'redo',    contractEnd: 2026, salaryKr: 33000, moral: 70, u21: false },
  { id: 17, num: 18, name: 'Jonas Ek',        pos: 'MF', age: 20, form: 68, status: 'bänken',  contractEnd: 2028, salaryKr: 19000, moral: 58, u21: true },

  // A (5)
  { id: 18, num: 12, name: 'David Kronberg',  pos: 'A', age: 28, form: 92, status: 'redo',    contractEnd: 2028, salaryKr: 48000, moral: 90, u21: false },
  { id: 19, num: 13, name: 'Adam Sundström',  pos: 'A', age: 26, form: 85, status: 'redo',    contractEnd: 2026, salaryKr: 39000, moral: 80, u21: false },
  { id: 20, num: 19, name: 'Linus Wikström',  pos: 'A', age: 24, form: 79, status: 'redo',    contractEnd: 2027, salaryKr: 34000, moral: 75, u21: false },
  { id: 21, num: 20, name: 'Nils Johansson',  pos: 'A', age: 18, form: 74, status: 'redo',    contractEnd: 2027, salaryKr: 16000, moral: 72, u21: true },
  { id: 22, num: 21, name: 'Edvin Brink',     pos: 'A', age: 23, form: 72, status: 'skadad',  contractEnd: 2026, salaryKr: 25000, moral: 50, u21: false, injuryDays: 5 },
];

// Default startelva (11 spelare, formation 1-3-2-4-1)
const DEFAULT_ELEVEN = new Set([1, 3, 4, 5, 6, 7, 10, 11, 12, 13, 18]);

const CURRENT_SEASON = 2026;

/* ───────────────────────── Hjälp-komponenter ───────────────────────── */

function FormBar({ value }) {
  const color = value >= 85 ? 'var(--success)'
              : value >= 70 ? 'var(--accent)'
              : value >= 60 ? '#B8A48C'
              : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 32, height: 4, borderRadius: 2,
        background: 'var(--border-light, #E5DDD0)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${value}%`, background: color,
        }} />
      </div>
      <span style={{
        fontFamily: 'Georgia, serif', fontSize: 12,
        color: 'var(--text-primary)', minWidth: 18, textAlign: 'right',
        fontWeight: 600,
      }}>{value}</span>
    </div>
  );
}

function StatusTag({ status, injuryDays }) {
  if (status === 'redo') return null; // Inga taggar för redo — texten räcker
  const map = {
    skadad: { label: injuryDays ? `Skadad · ${injuryDays}d` : 'Skadad', color: 'var(--danger)', bg: 'rgba(176,80,64,0.10)' },
    bänken: { label: 'Bänken', color: 'var(--text-muted)', bg: 'rgba(138,133,122,0.12)' },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span style={{
      fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase',
      color: s.color, background: s.bg,
      padding: '2px 7px', borderRadius: 3, fontWeight: 600,
    }}>{s.label}</span>
  );
}

function ContractBadge({ endYear }) {
  const yearsLeft = endYear - CURRENT_SEASON;
  let color, bg, label;
  if (yearsLeft <= 0) {
    color = 'var(--danger)'; bg = 'rgba(176,80,64,0.10)'; label = `Går ut vår ${endYear}`;
  } else if (yearsLeft === 1) {
    color = 'var(--accent)'; bg = 'rgba(196,122,58,0.10)'; label = `→ ${endYear}`;
  } else {
    color = 'var(--text-secondary)'; bg = 'transparent'; label = `→ ${endYear}`;
  }
  return (
    <span style={{
      fontSize: 10, fontFamily: 'Georgia, serif',
      color, background: bg,
      padding: bg === 'transparent' ? 0 : '2px 6px',
      borderRadius: 2, fontStyle: 'italic',
    }}>{label}</span>
  );
}

function NumberCircle({ num, inEleven }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: inEleven ? 'var(--accent)' : 'var(--bg-surface, #FAF6EE)',
      border: `1px solid ${inEleven ? 'var(--accent)' : 'var(--border, #D8CDB8)'}`,
      color: inEleven ? '#fff' : 'var(--text-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', fontSize: 12, fontWeight: 700,
      flexShrink: 0,
    }}>{num}</div>
  );
}

/* ───────────────────────── Spelarrad (lista) ───────────────────────── */

function PlayerRow({ player, inEleven, onToggleEleven, onExtend, onStats }) {
  const goingOut = player.contractEnd - CURRENT_SEASON <= 0;
  const isInactive = player.status === 'skadad';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 1fr auto auto',
      alignItems: 'center', gap: 10,
      padding: '10px 14px',
      borderBottom: '1px solid var(--border-light, #E5DDD0)',
      background: 'var(--bg, #FAF6EE)',
      opacity: isInactive ? 0.6 : 1,
    }}>
      <NumberCircle num={player.num} inEleven={inEleven} />

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '0.2px',
        }}>{player.name}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 2, fontSize: 10,
          color: 'var(--text-secondary)',
        }}>
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{player.age} år</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <ContractBadge endYear={player.contractEnd} />
          {player.u21 && <>
            <span style={{ opacity: 0.4 }}>·</span>
            <span style={{
              fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase',
              color: 'var(--accent)', fontWeight: 600,
            }}>U21</span>
          </>}
          {player.status !== 'redo' && <>
            <span style={{ opacity: 0.4 }}>·</span>
            <StatusTag status={player.status} injuryDays={player.injuryDays} />
          </>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{
          fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase',
          color: 'var(--text-muted)', fontWeight: 600,
        }}>FORM</span>
        <FormBar value={player.form} />
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <ActionButton
          label="11"
          active={inEleven}
          disabled={isInactive}
          onClick={() => !isInactive && onToggleEleven(player.id)}
          title={inEleven ? 'I startelvan' : 'Sätt i startelvan'}
        />
        {goingOut && (
          <ActionButton
            label="Förläng"
            warm
            onClick={() => onExtend(player)}
            title="Förläng kontrakt"
          />
        )}
        <ActionButton
          icon="stats"
          onClick={() => onStats(player)}
          title="Statistik & porträtt"
        />
      </div>
    </div>
  );
}

function ActionButton({ label, icon, active, warm, disabled, onClick, title }) {
  let bg, color, border;
  if (disabled) {
    bg = 'transparent'; color = 'var(--text-muted)'; border = '1px solid var(--border-light, #E5DDD0)';
  } else if (active) {
    bg = 'var(--accent)'; color = '#fff'; border = '1px solid var(--accent)';
  } else if (warm) {
    bg = 'rgba(196,122,58,0.10)'; color = 'var(--accent-dark, #8a5325)'; border = '1px solid rgba(196,122,58,0.40)';
  } else {
    bg = 'transparent'; color = 'var(--text-secondary)'; border = '1px solid var(--border, #D8CDB8)';
  }
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 26, minWidth: icon ? 26 : 0,
        padding: icon ? 0 : '0 8px',
        background: bg, color, border, borderRadius: 4,
        fontSize: 10, fontWeight: 700,
        letterSpacing: label === 'Förläng' ? 0.5 : 1,
        textTransform: label === 'Förläng' ? 'none' : 'uppercase',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon === 'stats' ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <rect x="1.5" y="7" width="2" height="4" fill="currentColor"/>
          <rect x="5" y="4.5" width="2" height="6.5" fill="currentColor"/>
          <rect x="8.5" y="2" width="2" height="9" fill="currentColor"/>
        </svg>
      ) : label}
    </button>
  );
}

/* ───────────────────────── Position-grupp ───────────────────────── */

function PositionGroup({ posCode, players, eleven, onToggleEleven, onExtend, onStats }) {
  const inElevenCount = players.filter(p => eleven.has(p.id)).length;
  return (
    <div>
      <div style={{
        padding: '8px 14px 4px',
        background: 'var(--bg-surface, #FAF6EE)',
        borderTop: '1px solid var(--border, #D8CDB8)',
        borderBottom: '1px solid var(--border-light, #E5DDD0)',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
          color: 'var(--accent-dark, #8a5325)', fontWeight: 700,
        }}>{POS_LABEL[posCode]}</span>
        <span style={{
          fontSize: 10, fontFamily: 'Georgia, serif', fontStyle: 'italic',
          color: 'var(--text-secondary)',
        }}>
          {inElevenCount} i elvan · {players.length} totalt
        </span>
      </div>
      {players.map(p => (
        <PlayerRow
          key={p.id}
          player={p}
          inEleven={eleven.has(p.id)}
          onToggleEleven={onToggleEleven}
          onExtend={onExtend}
          onStats={onStats}
        />
      ))}
    </div>
  );
}

/* ───────────────────────── Filter-rad ───────────────────────── */

function FilterRow({ filter, setFilter, counts }) {
  const filters = [
    { id: 'all', label: 'Alla', count: counts.all },
    { id: 'injured', label: 'Skadade', count: counts.injured },
    { id: 'expiring', label: 'Kontrakt ut', count: counts.expiring },
    { id: 'u21', label: 'U21', count: counts.u21 },
  ];
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '10px 12px',
      borderBottom: '1px solid var(--border-light, #E5DDD0)',
      background: 'var(--bg-paper, #EDE8DF)',
      overflowX: 'auto',
    }}>
      {filters.map(f => {
        const active = filter === f.id;
        return (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              flexShrink: 0,
              padding: '6px 10px',
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border, #D8CDB8)'}`,
              borderRadius: 4, cursor: 'pointer',
              fontSize: 10, fontWeight: 700,
              letterSpacing: 1, textTransform: 'uppercase',
              fontFamily: 'var(--font-body, system-ui, sans-serif)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {f.label}
            <span style={{
              fontFamily: 'Georgia, serif', fontWeight: 400,
              fontSize: 11, opacity: active ? 0.85 : 0.6,
              letterSpacing: 0,
            }}>{f.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Mode-toggle ───────────────────────── */

function ModeToggle({ mode, setMode }) {
  return (
    <span style={{
      display: 'inline-flex',
      border: '1px solid var(--border, #D8CDB8)',
      borderRadius: 4, overflow: 'hidden',
    }}>
      {['lista', 'plan'].map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          style={{
            padding: '5px 12px',
            background: mode === m ? 'var(--accent)' : 'transparent',
            color: mode === m ? '#fff' : 'var(--text-secondary)',
            border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase',
            fontFamily: 'var(--font-body, system-ui, sans-serif)',
          }}
        >{m}</button>
      ))}
    </span>
  );
}

/* ───────────────────────── Plan-läge (formation) ───────────────────────── */

function FormationView({ players, eleven }) {
  const playerById = id => players.find(p => p.id === id);
  const elevenIds = [...eleven];

  // Sortera per position
  const byPos = {};
  POS_ORDER.forEach(pos => byPos[pos] = []);
  elevenIds.forEach(id => {
    const p = playerById(id);
    if (p) byPos[p.pos].push(p);
  });

  const rows = [
    { pos: 'A',  players: byPos.A,  width: '60%' },
    { pos: 'MF', players: byPos.MF, width: '92%' },
    { pos: 'YH', players: byPos.YH, width: '76%' },
    { pos: 'B',  players: byPos.B,  width: '60%' },
    { pos: 'MV', players: byPos.MV, width: '20%' },
  ];

  return (
    <div style={{
      padding: '24px 18px',
      background: 'linear-gradient(180deg, #4a6e3a 0%, #5b7d44 100%)',
      minHeight: 540, position: 'relative',
      borderBottom: '1px solid var(--border, #D8CDB8)',
    }}>
      {/* Mittlinje + cirkel */}
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
        background: 'rgba(255,255,255,0.18)',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: 60, height: 60,
        marginTop: -30, marginLeft: -30, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.18)',
      }} />

      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: 28, height: '100%', position: 'relative', zIndex: 1,
      }}>
        {rows.map(r => (
          <div key={r.pos} style={{
            display: 'flex', justifyContent: 'space-around',
            margin: '0 auto', width: r.width,
          }}>
            {r.players.map(p => (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--bg, #FAF6EE)',
                  border: '2px solid #fff',
                  color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 700,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}>{p.num}</div>
                <span style={{
                  fontSize: 10, color: '#fff',
                  fontFamily: 'Georgia, serif', fontWeight: 600,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                }}>{p.name.split(' ').slice(-1)[0]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Trupp-skärmen ───────────────────────── */

function TruppScreen() {
  const [mode, setMode] = useState('lista'); // 'lista' | 'plan'
  const [filter, setFilter] = useState('all');
  const [eleven, setEleven] = useState(DEFAULT_ELEVEN);

  const counts = useMemo(() => ({
    all: SQUAD.length,
    injured: SQUAD.filter(p => p.status === 'skadad').length,
    expiring: SQUAD.filter(p => p.contractEnd - CURRENT_SEASON <= 0).length,
    u21: SQUAD.filter(p => p.u21).length,
  }), []);

  const filtered = useMemo(() => {
    let list = SQUAD;
    if (filter === 'injured')  list = list.filter(p => p.status === 'skadad');
    if (filter === 'expiring') list = list.filter(p => p.contractEnd - CURRENT_SEASON <= 0);
    if (filter === 'u21')      list = list.filter(p => p.u21);
    return list;
  }, [filter]);

  const grouped = useMemo(() => {
    const m = {};
    POS_ORDER.forEach(pos => m[pos] = []);
    filtered.forEach(p => m[p.pos].push(p));
    POS_ORDER.forEach(pos => {
      m[pos].sort((a, b) => b.form - a.form);
    });
    return m;
  }, [filtered]);

  const toggleEleven = (id) => {
    setEleven(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const extend = (p) => console.log('Förläng', p.name);
  const stats = (p) => console.log('Stats', p.name);

  return (
    <div className="phone phone-light">
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--bg-leather-dark, #2C2A24)',
        borderBottom: '2px solid var(--accent)',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{
              fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
              color: 'var(--accent)', opacity: 0.85, fontWeight: 600,
            }}>Forsbacka BK · A-trupp</div>
            <div style={{
              fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700,
              color: '#F5F1EB', marginTop: 2, letterSpacing: 0.3,
            }}>Trupp</div>
          </div>
          <ModeToggle mode={mode} setMode={setMode} />
        </div>
        <div style={{
          marginTop: 6, fontSize: 11, fontFamily: 'Georgia, serif',
          fontStyle: 'italic', color: '#C9B89A',
        }}>
          {SQUAD.length} spelare · {eleven.size}/11 i startelvan · säsong {CURRENT_SEASON}
        </div>
      </div>

      {mode === 'lista' && (
        <>
          <FilterRow filter={filter} setFilter={setFilter} counts={counts} />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {POS_ORDER.map(pos => (
              grouped[pos].length > 0 && (
                <PositionGroup
                  key={pos}
                  posCode={pos}
                  players={grouped[pos]}
                  eleven={eleven}
                  onToggleEleven={toggleEleven}
                  onExtend={extend}
                  onStats={stats}
                />
              )
            ))}
          </div>
        </>
      )}

      {mode === 'plan' && (
        <FormationView players={SQUAD} eleven={eleven} />
      )}
    </div>
  );
}

/* ───────────────────────── Notes-panel ───────────────────────── */

function NotesTrupp() {
  return (
    <div className="notes" style={{ left: 'calc(100% + 32px)', width: 380 }}>
      <h4>Trupp — överblick + djup på ett</h4>
      <p>Lista är default; Plan är toggleable. Tät rad: nummer, namn, form, tre actions. Trippelkolumnen står sig på 375 px om kontraktsbadgen bara visas när den är aktuell.</p>

      <h5>Lägen</h5>
      <ul>
        <li><em>Lista</em> — gruppera på position (MV → A), sortera på form. Skadad-rad dimmas (opacity 0.6).</li>
        <li><em>Plan</em> — formation 1-3-2-4-1 över bandyplan (grön bakgrund, mittlinje + cirkel). Visar bara namn + nummer per spelare i elvan.</li>
      </ul>

      <h5>Filter</h5>
      <p>Alla / Skadade / Kontrakt går ut / U21. Antal per filter visas inline i Georgia.</p>

      <h5>Spelarrad — tre actions</h5>
      <ul>
        <li><em>11</em> — toggle in/ut ur startelvan. Aktiv = kopparfylld, inaktiv = outline. Skadade = disabled.</li>
        <li><em>Förläng</em> — visas bara om kontraktet går ut innevarande säsong (varm kopparton).</li>
        <li><em>📊</em> — alltid synlig, leder till spelarporträtt + stats.</li>
      </ul>

      <h5>Form-bar</h5>
      <p>Liten 32×4-bar + 12px Georgia-siffra. Tröskel: 85+ grön, 70-84 koppar, 60-69 bleknad, &lt;60 röd.</p>

      <h5>Kontrakt-badge</h5>
      <ul>
        <li><em>Går ut vår 2026</em> — röd, fylld pill (säsong = current)</li>
        <li><em>→ 2026</em> — koppar, fylld pill (1 år kvar)</li>
        <li><em>→ 2028</em> — secondary, ren text (≥2 år)</li>
      </ul>

      <h5>Header</h5>
      <p>Mörkt läderband med kopparlinje under. Klubbnamn + "A-trupp" som meta-rad i 9px UPPERCASE; "Trupp" stort i Georgia. Subtext: spelarantal · elva-status · säsong.</p>

      <h5>Förbjudet i denna vy</h5>
      <ul>
        <li>Emojier på status-tags (regel från tags-systemet)</li>
        <li>Egen knapp-typ — ActionButton är en kompakt variant av .btn-outline/.btn-primary</li>
        <li>Sortera på namn eller ålder som default — form är primärt</li>
      </ul>
    </div>
  );
}

window.TruppArtboards = {
  TruppScreen,
  NotesTrupp,
};
