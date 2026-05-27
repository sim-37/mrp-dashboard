import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { formatKrDate } from '../../lib/format'
import type { DatasetMeta } from '../../types/mrp'

interface Props {
  meta: DatasetMeta | null
  refreshIntervalMs: number
  lastUpdatedAt: number | null
}

const formatHHMMSS = (d: Date): string => {
  return d.toLocaleTimeString('ko-KR', { hour12: false })
}

const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      `inline-flex items-center rounded-sm px-2 py-1 text-[13px] tracking-tight ${
        isActive
          ? 'bg-[color:var(--color-accent)] text-white'
          : 'text-ink-2 hover:bg-surface-muted'
      }`
    }
  >
    {children}
  </NavLink>
)

const AppHeader: React.FC<Props> = ({ meta, refreshIntervalMs, lastUpdatedAt }) => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const nextMs = lastUpdatedAt
    ? Math.max(0, lastUpdatedAt + refreshIntervalMs - now.getTime())
    : refreshIntervalMs
  const nextSec = Math.ceil(nextMs / 1000)

  // 갱신 직후 1.5초 동안 점등 (방금 데이터 받음)
  const ageMs = lastUpdatedAt ? now.getTime() - lastUpdatedAt : Infinity
  const blinking = ageMs < 1500

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-surface)]/85 no-print"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-6 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full transition"
            style={{
              background: blinking ? 'var(--color-ok-500)' : 'var(--color-text-tertiary)',
              boxShadow: blinking ? '0 0 0 3px rgba(22,163,74,0.18)' : 'none',
            }}
            aria-label={blinking ? '데이터 갱신 중' : '대기'}
          />
          <span className="font-mono text-[12px] font-semibold tracking-tight text-ink">MRP / 발주 콘솔</span>
        </div>

        <nav className="flex items-center gap-1">
          <NavItem to="/">대시보드</NavItem>
          <NavItem to="/upload">CSV 업로드</NavItem>
          <NavItem to="/report">보고서</NavItem>
          <NavItem to="/styleguide">스타일</NavItem>
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] text-ink-3">
          {meta && (
            <>
              <span>
                기준일{' '}
                <span className="num font-semibold text-ink-2">{formatKrDate(meta.today)}</span>
              </span>
              <span className="hidden sm:inline">·</span>
              <span>
                부품{' '}
                <span className="num font-semibold text-ink-2">
                  {meta.partCount.toLocaleString('ko-KR')}
                </span>
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden md:inline" title={`업로드: ${meta.uploadedAt}`}>
                {meta.filename}
              </span>
              <span className="hidden sm:inline">·</span>
            </>
          )}
          <span>
            {formatHHMMSS(now)} 갱신 · 다음{' '}
            <span className="num">{Math.max(0, nextSec)}s</span>
          </span>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
