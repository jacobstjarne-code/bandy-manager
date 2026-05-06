/* Artboards för intro-flödet — efter klubbvalet.
 * EN sammanhängande scen: Ankomsten + Styrelsemötet i samma duk, kumulativt.
 * Ankomstens 3 rader stannar kvar (dimmade), dialogen byggs upp under dem.
 * Pixelvärden replikerar koden i bandy-manager (CoffeeExchange, BoardMeetingScene, SceneCTA).
 */

const { useState, useEffect } = React;

/* ───────────────────────── Delade primitiver ───────────────────────── */

function GenreLabel({ children }) {
  return <div className="genre" style={{ marginBottom: 10 }}>{children}</div>;
}

function Divider() {
  return <div className="divider-thin" style={{ margin: '4px 0' }} />;
}

function SceneCTA({ label, onClick }) {
  return (
    <button className="scene-cta" onClick={onClick}>{label}</button>
  );
}

function CoffeeRow({ initial, name, text, align = 'left' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        textAlign: align,
        opacity: 0,
        animation: 'fade-in-soft 0.6s ease-out forwards',
      }}
    >
      <div className="initial-circle">{initial}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="speaker-name">{name}</div>
        <div className="speaker-quote">{`"${text}"`}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── Den kontinuerliga scenen ───────────────────────── */

/* Rörelser:
 *   0 — Ankomsten fade:ar in (auto, 3.4 s)
 *   1 — CTA "Gå in" → kassören (Margareta) syns, Ankomsten dimmas till bakgrund
 *   2 — CTA "Förstått" → ordförande (Pelle)
 *   3 — CTA "Det går bra" → ledamot (Sture)
 *   4 — CTA "Då börjar vi" → in i spelet
 */

function ContinuousScene() {
  const [step, setStep] = useState(0);
  const [arrivalDone, setArrivalDone] = useState(false);

  // Auto-advance Ankomsten — efter sista raden + CTA-fadein har spelaren CTA:n
  useEffect(() => {
    const t = setTimeout(() => setArrivalDone(true), 3400);
    return () => clearTimeout(t);
  }, []);

  // Dimma Ankomsten när dialog börjar (steg ≥ 1)
  const arrivalDim = step >= 1;

  // 4 dialogsteg + 1 slut
  const ctaLabel =
    step === 0 ? 'Gå in →' :
    step === 1 ? 'Förstått' :
    step === 2 ? 'Det går bra' :
    step === 3 ? 'Då börjar vi' :
    null;

  // Progress: 4 streck för 4 dialogsteg (Ankomsten räknas inte — den är inramning)
  const totalSteps = 4;

  return (
    <div className="phone" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Subtilt copper-glow uppifrån — bara under Ankomsten */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 70%)',
        pointerEvents: 'none',
        opacity: arrivalDim ? 0.3 : 1,
        transition: 'opacity 0.8s ease-out',
      }} />

      {/* Header — genre-etikett, byts inte */}
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 24px 0', textAlign: 'center' }}>
        <div className="fadein" style={{ animationDelay: '200ms' }}>
          <GenreLabel>⬩ &nbsp;Ankomsten&nbsp; ⬩</GenreLabel>
        </div>

        {/* Progress visas först när dialog påbörjats */}
        {step >= 1 && (
          <div className="beat-progress" style={{
            marginTop: 14,
            opacity: 0,
            animation: 'fade-in-static 0.5s ease-out forwards',
            animationDelay: '300ms',
          }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span key={i} className={`dot${i < step ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* Inramningsblock — Ankomsten. Dimmas men försvinner inte. */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '32px 36px 12px',
        textAlign: 'center',
        opacity: arrivalDim ? 0.42 : 1,
        transition: 'opacity 0.9s ease-out, padding 0.5s ease-out',
        paddingTop: arrivalDim ? 18 : 32,
        paddingBottom: arrivalDim ? 4 : 12,
      }}>
        <div
          className="fadein prose"
          style={{
            animationDelay: '600ms',
            fontSize: arrivalDim ? 18 : 26,
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            color: 'var(--text-light)',
            marginBottom: arrivalDim ? 6 : 16,
            transition: 'font-size 0.6s ease-out, margin-bottom 0.6s ease-out',
          }}
        >
          Forsbacka.
        </div>

        <div
          className="fadein prose prose-em"
          style={{
            animationDelay: '1400ms',
            fontSize: arrivalDim ? 12 : 16,
            transition: 'font-size 0.6s ease-out',
            marginBottom: arrivalDim ? 4 : 12,
          }}
        >
          Onsdag kväll. Lampan vid klubbhuset lyser. De väntar dig där inne.
        </div>

        <div
          className="fadein prose prose-em"
          style={{
            animationDelay: '2400ms',
            fontSize: arrivalDim ? 12 : 16,
            transition: 'font-size 0.6s ease-out',
          }}
        >
          Pelle Nordin. Margareta Lind. Sture.
          {!arrivalDim && <><br />Tre kaffekoppar redan på bordet.</>}
        </div>
      </div>

      {/* Tunn divider mellan inramning och dialog — visas när dialogen startat */}
      {step >= 1 && (
        <div style={{
          padding: '0 32px',
          opacity: 0,
          animation: 'fade-in-static 0.6s ease-out forwards',
          animationDelay: '200ms',
        }}>
          <Divider />
        </div>
      )}

      {/* Dialogblock — byggs upp kumulativt */}
      <div style={{
        flex: 1,
        position: 'relative',
        zIndex: 1,
        padding: '14px 20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
      }}>
        {step >= 1 && (
          <CoffeeRow
            key="margareta"
            initial="M"
            name="MARGARETA · KASSÖR"
            text="Truppen är 22. Sex kontrakt går ut i vår. Kassa 380 tkr, transferbudget 120. Mer har vi inte."
            align="left"
          />
        )}

        {step >= 2 && (
          <CoffeeRow
            key="pelle"
            initial="P"
            name="PELLE · ORDFÖRANDE"
            text="Plats fem till åtta. Inget kvalspel. Och håll bygden med oss — tomma läktare är dåligt för bandyn och dåligt för budgeten."
            align="right"
          />
        )}

        {step >= 3 && (
          <CoffeeRow
            key="sture"
            initial="S"
            name="STURE · LEDAMOT"
            text="För många här är det här säsongens enda samling. Glöm inte det."
            align="left"
          />
        )}
      </div>

      {/* CTA — byts beroende på steg */}
      {ctaLabel && (
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '12px 20px 28px',
          opacity: step === 0 && !arrivalDone ? 0 : 1,
          animation: step === 0 ? 'fade-in-static 0.6s ease-out forwards' : 'none',
          animationDelay: '3400ms',
          transition: step > 0 ? 'opacity 0.3s' : 'none',
          pointerEvents: step === 0 && !arrivalDone ? 'none' : 'auto',
        }}>
          <SceneCTA
            label={ctaLabel}
            onClick={() => setStep(s => Math.min(s + 1, 4))}
          />
        </div>
      )}

      {/* Slutläge — efter sista CTA, fade till "in i spelet" */}
      {step >= 4 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          background: 'var(--bg-scene)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0,
          animation: 'fade-in-static 0.8s ease-out forwards',
        }}>
          <span style={{
            fontSize: 11, color: 'var(--text-muted)',
            letterSpacing: 3, textTransform: 'uppercase',
          }}>
            → Dashboard
          </span>
        </div>
      )}
    </div>
  );
}

/* Reset-knapp och stegindikator (utanför själva ramen, för canvas) */
function ContinuousSceneWithControls() {
  const [key, setKey] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <ContinuousScene key={key} />
      <button
        onClick={() => setKey(k => k + 1)}
        style={{
          background: 'transparent',
          border: '1px solid #C4BAA8',
          color: '#C4BAA8',
          padding: '6px 14px',
          borderRadius: 4,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        ↺ Spela om
      </button>
    </div>
  );
}

/* ───────────────────────── Notes-panel ───────────────────────── */

function NotesContinuous() {
  return (
    <div className="notes" style={{ left: 'calc(100% + 32px)', width: 360 }}>
      <h4>En sammanhängande scen — Ankomsten</h4>
      <p>Hela inflödet (klubbval → första röran med klubben) är <em>en</em> scen, inte fyra. Spelaren klipper aldrig till svart mellan rörelserna — bakgrunden består, genre-etiketten består.</p>

      <h5>Rörelse 1 — Utanför (auto, ~3.4 s)</h5>
      <ul>
        <li>Klubbnamnet stort. Får andas.</li>
        <li>Tid + plats. "Onsdag kväll. Lampan vid klubbhuset lyser."</li>
        <li>Styrelsens namn + bildelement (kaffekopparna).</li>
        <li>CTA "Gå in →" tonas in.</li>
      </ul>

      <h5>Rörelse 2-4 — Vid bordet (kumulativt)</h5>
      <p>När spelaren trycker "Gå in":</p>
      <ul>
        <li>Ankomsten dimmas (opacity 0.42, font-size krymper) men <em>försvinner inte</em>. Den blir scenens minne.</li>
        <li>Tunn divider tonas in mellan inramning och dialog.</li>
        <li>Margareta (kassör) syns. Vänster, M-cirkel.</li>
        <li>Tryck "Förstått" → Pelle (ordförande) läggs till. Höger, P-cirkel.</li>
        <li>Tryck "Det går bra" → Sture (ledamot) läggs till. Vänster, S-cirkel.</li>
        <li>Tryck "Då börjar vi" → fade till Dashboard.</li>
      </ul>

      <h5>Visuella beslut</h5>
      <ul>
        <li><em>Genre-etiketten byts inte</em> — det <em>är</em> Ankomsten hela vägen. Du har anlänt; nu sitter du där.</li>
        <li><em>Progress (4 streck)</em> visas först när dialogen startar. Ankomsten räknas inte — den är inramning, inte en beat.</li>
        <li><em>Ankomstens text dimmas men visas</em> hela vägen — så scenen ackumulerar minne i sitt eget rum.</li>
        <li><em>Copper-glow:t från ovan</em> dimmas också när du går in (du är inomhus nu).</li>
        <li><em>CoffeeRow vänster/höger-alternering</em> följer kafferummets språk exakt.</li>
      </ul>

      <h5>Dynamik</h5>
      <ul>
        <li>Klubbnamn från valet</li>
        <li>Veckodag/tid från currentDate</li>
        <li>Styrelsens namn (chairman/treasurer/member) per klubb</li>
        <li>Siffror (truppstorlek, kontrakt, kassa) flätas in i Margaretas replik</li>
      </ul>
    </div>
  );
}

window.IntroArtboards = {
  ContinuousScene: ContinuousSceneWithControls,
  NotesContinuous,
};
