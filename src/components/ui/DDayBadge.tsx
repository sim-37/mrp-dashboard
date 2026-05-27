import React from 'react'

interface Props {
  /** breach까지 남은 일수. null이면 안전권. */
  days: number | null
  className?: string
}

const toneForDays = (d: number | null): { bg: string; fg: string; ring: string; label: string } => {
  if (d == null) {
    return { bg: 'rgba(168,162,158,0.12)', fg: '#57534E', ring: 'rgba(168,162,158,0.4)', label: '안전권' }
  }
  if (d <= 2) return { bg: 'rgba(225,29,72,0.10)', fg: '#9F1239', ring: 'rgba(225,29,72,0.35)', label: `D-${d}` }
  if (d <= 7) return { bg: 'rgba(249,115,22,0.10)', fg: '#C2410C', ring: 'rgba(249,115,22,0.35)', label: `D-${d}` }
  if (d <= 14) return { bg: 'rgba(245,158,11,0.10)', fg: '#92400E', ring: 'rgba(245,158,11,0.35)', label: `D-${d}` }
  return { bg: 'rgba(120,113,108,0.10)', fg: '#57534E', ring: 'rgba(120,113,108,0.30)', label: `D-${d}` }
}

const DDayBadge: React.FC<Props> = ({ days, className = '' }) => {
  const t = toneForDays(days)
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tracking-tight ${className}`}
      style={{ background: t.bg, color: t.fg, boxShadow: `inset 0 0 0 1px ${t.ring}` }}
    >
      <span className="num">{t.label}</span>
    </span>
  )
}

export default DDayBadge
