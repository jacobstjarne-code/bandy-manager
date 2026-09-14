interface FeatureIntroductionProps {
  speaker: string
  role: string
  text: string
  onDismiss?: () => void
}

/** A contextual first meeting with a system, voiced by someone already known. */
export function FeatureIntroduction({ speaker, role, text, onDismiss }: FeatureIntroductionProps) {
  return (
    <div className="card-sharp" style={{
      borderLeft: '3px solid var(--accent)',
      padding: '12px 14px',
      marginBottom: 12,
      background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-card))',
    }}>
      <p style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--accent)',
        marginBottom: 6,
      }}>
        {speaker} · {role}
      </p>
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fontStyle: 'italic',
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
        margin: 0,
      }}>
        “{text}”
      </p>
      {onDismiss && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={onDismiss}
          style={{ marginTop: 10, padding: '6px 12px', fontSize: 11 }}
        >
          Jag förstår
        </button>
      )}
    </div>
  )
}
