export function GoldConfetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: (i * 37 + 11) % 100,
    delay: (i * 0.17) % 3,
    duration: 3 + (i * 0.13) % 3,
    color: i % 3 === 0 ? '#C9A84C' : i % 3 === 1 ? '#F0F4F8' : '#FFD700',
    size: 6 + (i % 6),
  }))
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes goldPulse {
          0%, 100% { text-shadow: 0 0 20px rgba(201,168,76,0.4); }
          50% { text-shadow: 0 0 40px rgba(201,168,76,0.8), 0 0 60px rgba(201,168,76,0.4); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              borderRadius: 2,
              animation: `confettiFall ${p.duration}s ${p.delay}s infinite linear`,
            }}
          />
        ))}
      </div>
    </>
  )
}
