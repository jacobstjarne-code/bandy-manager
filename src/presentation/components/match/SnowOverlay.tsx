export function SnowOverlay() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: 3 + Math.random() * 3,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 4 + Math.random() * 4,
    opacity: 0.3 + Math.random() * 0.3,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'white',
            opacity: p.opacity,
            animation: `snowfall ${p.duration}s ${p.delay}s infinite linear`,
          }}
        />
      ))}
    </div>
  )
}
