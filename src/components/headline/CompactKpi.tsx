import React from 'react'
import { formatCurrency, formatInt } from '../../lib/format'

interface Props {
  totalParts: number
  riskParts: number
  totalShortage: number
  expectedOrderAmount: number
}

const Stat: React.FC<{ label: string; value: React.ReactNode; emphasis?: 'danger' | 'ink' }> = ({
  label,
  value,
  emphasis = 'ink',
}) => (
  <div className="flex items-baseline justify-between gap-2 border-b border-line py-2 last:border-b-0">
    <span className="text-[11px] uppercase tracking-wide text-ink-3">{label}</span>
    <span
      className="num text-[16px] font-semibold leading-none"
      style={{ color: emphasis === 'danger' ? 'var(--color-danger-700)' : 'var(--color-text-primary)' }}
    >
      {value}
    </span>
  </div>
)

const CompactKpi: React.FC<Props> = ({ totalParts, riskParts, totalShortage, expectedOrderAmount }) => {
  return (
    <div className="rounded-md bg-surface p-3 shadow-1" style={{ boxShadow: 'inset 0 0 0 1px var(--color-border), var(--shadow-1)' }}>
      <Stat label="전체 부품" value={formatInt(totalParts)} />
      <Stat label="위험 부품" value={formatInt(riskParts)} emphasis="danger" />
      <Stat label="부족 예측 합계" value={formatInt(totalShortage)} />
      <Stat label="권장 발주금액" value={formatCurrency(expectedOrderAmount)} />
    </div>
  )
}

export default CompactKpi
