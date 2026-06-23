import type { TabIntroEntry } from '../../../domain/data/tabIntros'

interface TabIntroProps {
  entry: TabIntroEntry
}

export function TabIntro({ entry }: TabIntroProps) {
  if (!entry.text || entry.text === '// OPUS_COPY') return null
  return (
    <p className="tab-bar-desc">
      {entry.icon} {entry.text}
    </p>
  )
}
