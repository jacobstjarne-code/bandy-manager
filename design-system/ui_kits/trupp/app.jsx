/* Trupp-canvas — app-skal */

const { DesignCanvas, DCSection, DCArtboard } = window;
const { TruppScreen, NotesTrupp } = window.TruppArtboards;

function ArtboardWithNotes({ children, notes }) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      {notes}
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="trupp"
        title="Trupp — A-laget"
        subtitle="Lista (default) + Plan-toggle. Gruppera på position, sortera på form. Tre actions per rad: 11, Förläng, Stats."
      >
        <DCArtboard id="trupp-screen" label="Trupp · 22 spelare" width={780} height={820}>
          <ArtboardWithNotes notes={<NotesTrupp />}>
            <TruppScreen />
          </ArtboardWithNotes>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
