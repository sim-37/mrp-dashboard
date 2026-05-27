import React from 'react'

interface Props {
  label: string
  value: React.ReactNode
  hint?: string
  emphasis?: 'danger' | 'warn' | 'ink'
  align?: 'left' | 'right'
}

const StatRow: React.FC<Props> = ({ label, value, hint, emphasis = 'ink', align = 'left' }) => {
  const colorVar =
    emphasis === 'danger'
      ? 'var(--color-danger-700)'
      : emphasis === 'warn'
      ? 'var(--color-warn-600)'
      : 'var(--color-text-primary)'

  return (
    <div className={`flex flex-col gap-0.5 ${align === 'right' ? 'items-end text-right' : ''}`}>
      <span className="text-[11px] uppercase tracking-wide text-ink-3">{label}</span>
      <span className="num text-[15px] font-semibold leading-tight" style={{ color: colorVar }}>
        {value}
      </span>
      {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
    </div>
  )
}

export default StatRow
