import React from 'react'

interface Props {
  tone?: 'plain' | 'danger' | 'warn' | 'amber' | 'ok' | 'accent'
  padded?: boolean
  interactive?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

const toneRing: Record<NonNullable<Props['tone']>, string> = {
  plain: 'var(--color-border)',
  danger: 'rgba(225,29,72,0.32)',
  warn: 'rgba(249,115,22,0.32)',
  amber: 'rgba(245,158,11,0.32)',
  ok: 'rgba(22,163,74,0.32)',
  accent: 'rgba(15,23,42,0.7)',
}

const toneBg: Record<NonNullable<Props['tone']>, string> = {
  plain: 'var(--color-surface)',
  danger: 'var(--color-surface)',
  warn: 'var(--color-surface)',
  amber: 'var(--color-surface)',
  ok: 'var(--color-surface)',
  accent: 'var(--color-surface)',
}

const Card: React.FC<Props> = ({
  tone = 'plain',
  padded = true,
  interactive = false,
  className = '',
  children,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-md shadow-1 ${padded ? 'p-4' : ''} ${interactive ? 'transition hover:shadow-2 cursor-pointer' : ''} ${className}`}
      style={{ background: toneBg[tone], boxShadow: `inset 0 0 0 1px ${toneRing[tone]}, var(--shadow-1)` }}
    >
      {children}
    </div>
  )
}

export default Card
