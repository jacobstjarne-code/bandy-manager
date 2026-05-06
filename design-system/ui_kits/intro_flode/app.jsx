/* Intro-flöde canvas — app-skal */

const { DesignCanvas, DCSection, DCArtboard } = window;
const { ContinuousScene, NotesContinuous } = window.IntroArtboards;

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
        id="efter-klubbval"
        title="Efter klubbvalet — vägen in i säsongen"
        subtitle="EN sammanhängande scen: Ankomsten + Styrelsemötet kumulativt. Tryck dig genom rörelserna."
      >
        <DCArtboard id="continuous" label="Ankomsten — kumulativ scen" width={760} height={820}>
          <ArtboardWithNotes notes={<NotesContinuous />}>
            <ContinuousScene />
          </ArtboardWithNotes>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
