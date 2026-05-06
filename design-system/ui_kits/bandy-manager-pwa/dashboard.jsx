const { useState, useMemo } = React;

function DashboardScreen({ goMatch }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-november)', padding: '10px 12px 120px' }}>
      {/* Daily briefing — narrative card */}
      <CardRound style={{ marginBottom: 10 }}>
        <SectionLabel emoji="📣">DAGBOKEN · ONS 27 NOV</SectionLabel>
        <p className="h-quote" style={{ margin: 0 }}>
          "Vinden river i flaggan. Skutskär väntar på fredag — hallen är redan fylld. Brukspatronen hörs i korridoren: <em>vi viker oss inte</em>."
        </p>
      </CardRound>

      {/* Next match — hero */}
      <div style={{ marginBottom: 10, borderRadius: 8, overflow: 'hidden',
        border: '1.5px solid rgba(196,122,58,0.30)', background: 'rgba(196,122,58,0.03)' }}>
        <div style={{ background: 'var(--match-bg-cold)', padding: '8px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🔥</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--match-gold)' }}>
              Derby · Nästa match
            </span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1,
            background: 'var(--accent-dark)', color: 'var(--text-light)',
            padding: '2px 7px', borderRadius: 99 }}>HEMMA</span>
        </div>
        <div style={{ padding: '14px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <ClubBadge club="forsbacka" size={44}/>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, margin: '4px 0 0' }}>Forsbacka</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>
              fre 19:00
            </p>
            <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '2px 0 0' }}>Lindhagen IP · -4 °C</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <ClubBadge club="skutskar" size={44}/>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, margin: '4px 0 0', color: 'var(--text-secondary)' }}>Skutskär</p>
          </div>
        </div>
        <div style={{ padding: '6px 12px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="h-label" style={{ margin: 0 }}>FORM</span>
            <FormDots results={['V','V','O','F','V']}/>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-dark)', fontSize: 12, marginLeft: 4 }}>
              V2 · O1 · F1
            </span>
          </div>
        </div>
      </div>

      {/* 2×2 grid of data cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <CardSharp>
          <SectionLabel emoji="💰">EKONOMI</SectionLabel>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>148 400 kr</p>
          <p style={{ fontSize: 10, color: 'var(--success-light)', fontWeight: 600, margin: '2px 0 0' }}>+8 400 /omg</p>
        </CardSharp>
        <CardSharp>
          <SectionLabel emoji="📊">TABELL</SectionLabel>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>
            3:a <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>av 12</span>
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '2px 0 0' }}>26 p · 7V 5O 1F</p>
        </CardSharp>
        <CardSharp>
          <SectionLabel emoji="👥">TRUPP</SectionLabel>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 3 }}>
            <Tag variant="red">2 skadade</Tag>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '4px 0 0' }}>18 spelare · 1 tvekar</p>
        </CardSharp>
        <CardSharp>
          <SectionLabel emoji="🏋️">TRÄNING</SectionLabel>
          <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>Isteknik</p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: '2px 0 0' }}>3 dagar kvar · intensivt</p>
        </CardSharp>
      </div>

      {/* Single-row contextual nudges */}
      <RowCard emoji="📋" label="KONTRAKT" value="Holmgren utgår om 4 omg"/>
      <RowCard emoji="👤" label="PATRON"   value="Brukspatronen vill prata"/>
      <RowCard emoji="📬" label="INKORG"   value="3 olästa · 1 pressfråga"/>

      <DiamondDivider/>

      {/* Bygdens puls — narrative */}
      <CardRound style={{ marginBottom: 10 }}>
        <SectionLabel emoji="🏠">BYGDENS PULS</SectionLabel>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #C47A3A, #8B4820)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#F5F1EB', flexShrink: 0,
          }}>❤</div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Ortens stämning: stigande</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
              Två raka vinster och ett derby i helgen — kaféerna pratar om inget annat.
            </p>
          </div>
        </div>
      </CardRound>
    </div>
  );
}

function CtaBar({ children }) {
  return (
    <div style={{
      position: 'absolute', bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom))',
      left: 0, right: 0, padding: '10px 12px',
      background: 'linear-gradient(to bottom, transparent, var(--bg) 30%)',
      pointerEvents: 'none',
    }}>
      <div style={{ pointerEvents: 'auto' }}>{children}</div>
    </div>
  );
}

Object.assign(window, { DashboardScreen, CtaBar });
