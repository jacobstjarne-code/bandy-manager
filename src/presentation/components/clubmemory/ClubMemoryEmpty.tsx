export function ClubMemoryEmpty() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 30px',
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.4 }}>📖</div>
      <h3 style={{
        fontFamily: 'Georgia, serif',
        fontSize: 16,
        color: 'var(--text-light-secondary)',
        marginBottom: 10,
        fontWeight: 400,
      }}>
        Historien tar form
      </h3>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
        Klubbens historia tar form. När säsonger spelas och milstolpar nås kommer minnen att samlas här.
      </p>
    </div>
  )
}
