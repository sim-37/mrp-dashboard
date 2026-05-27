import React from 'react'
import type { Grade } from '../../types/mrp'

interface Props {
  grade: Grade | null
  kind?: '금액' | '단가' | '수량'
}

const palette: Record<Grade, { bg: string; fg: string }> = {
  A: { bg: 'rgba(15,23,42,0.92)', fg: '#FAFAF9' },
  B: { bg: 'rgba(231,229,228,0.9)', fg: '#1C1917' },
  C: { bg: 'rgba(231,229,228,0.6)', fg: '#57534E' },
}

const GradeBadge: React.FC<Props> = ({ grade, kind }) => {
  if (!grade) return <span className="text-xs text-ink-3">-</span>
  const p = palette[grade]
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-[10px] font-semibold leading-none"
      style={{ background: p.bg, color: p.fg }}
      title={kind ? `${kind} 등급` : '등급'}
    >
      {grade}
    </span>
  )
}

export default GradeBadge
