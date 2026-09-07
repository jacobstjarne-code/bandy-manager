interface ToggleSwitchProps {
  on: boolean
  onChange: (next: boolean) => void
  ariaLabel: string
}

/**
 * Notisinstallningar.dc.html (mock-lås, stickiness-settings-kategorier):
 * track 42×24, knopp 18, på = --accent, av = --border-dark. Ingen on/av-
 * switch fanns i systemet tidigare (bara SegmentedToggle). Raden som
 * innehåller switchen äger ≥44px tap-target — inte switchen själv, som är
 * ett visuellt element, inte den klickbara ytan.
 */
export function ToggleSwitch({ on, onChange, ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      style={{
        width: 42, height: 24, borderRadius: 99, flexShrink: 0, position: 'relative',
        background: on ? 'var(--accent)' : 'var(--border-dark)',
        border: 'none', padding: 0, cursor: 'pointer',
      }}
    >
      <span style={{
        // Mocken skrev knoppens vita bakgrund som en rå hexkod — --bg-elevated
        // är samma vita värde som designsystemets egna token (design-system/
        // colors_and_type.css), inga hårdkodade hex i src/ (verifieringsgrepp).
        width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-elevated)',
        position: 'absolute', top: 3,
        left: on ? 21 : 3,
        boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
        transition: 'left 120ms ease',
      }} />
    </button>
  )
}
