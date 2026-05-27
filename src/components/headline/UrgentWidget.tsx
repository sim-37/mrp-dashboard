import React from 'react'
import type { Part, UrgencyResult } from '../../types/mrp'
import DDayBadge from '../ui/DDayBadge'
import GradeBadge from '../ui/GradeBadge'
import Sparkline from '../ui/Sparkline'
import Card from '../ui/Card'
import { formatCurrency, formatInt, formatShortDate } from '../../lib/format'

interface Props {
  topThree: UrgencyResult[]
  partMap: Map<string, Part>
  dates: string[]
  today: string
  onPick?: (partNo: string) => void
  selectedPartNo?: string | null
}

const lastNDates = (dates: string[], today: string, n: number): string[] => {
  const idx = dates.indexOf(today)
  const endIdx = idx >= 0 ? idx : dates.length - 1
  const startIdx = Math.max(0, endIdx - n + 1)
  return dates.slice(startIdx, endIdx + 1)
}

const seriesValues = (
  ds: string[],
  part: Part,
  key: 'stock' | 'plannedStock' | 'safetyStock',
): (number | null)[] => ds.map((d) => part.series[key][d] ?? null)

const fillNulls = (vs: (number | null)[]): (number | null)[] => {
  let last: number | null = null
  return vs.map((v) => {
    if (v != null) last = v
    return last
  })
}

const UrgentCard: React.FC<{
  ur: UrgencyResult
  part: Part
  dates: string[]
  today: string
  onPick?: (no: string) => void
  selected: boolean
}> = ({ ur, part, dates, today, onPick, selected }) => {
  const lastDates = lastNDates(dates, today, 30)
  const stockSeries = fillNulls(seriesValues(lastDates, part, 'stock'))
  const plannedSeries = fillNulls(seriesValues(lastDates, part, 'plannedStock'))
  const stockLine = stockSeries.map((v, i) => (v != null ? v : plannedSeries[i] ?? null))
  const safetyLine = fillNulls(seriesValues(lastDates, part, 'safetyStock'))

  const accentColor =
    ur.daysUntilBreach == null
      ? 'var(--color-text-secondary)'
      : ur.daysUntilBreach <= 2
      ? 'var(--color-danger-600)'
      : ur.daysUntilBreach <= 7
      ? 'var(--color-warn-600)'
      : 'var(--color-amber-500)'

  return (
    <Card
      tone={ur.daysUntilBreach != null && ur.daysUntilBreach <= 2 ? 'danger' : ur.daysUntilBreach != null && ur.daysUntilBreach <= 7 ? 'warn' : ur.daysUntilBreach != null ? 'amber' : 'plain'}
      interactive
      onClick={() => onPick?.(part.partNo)}
      className={selected ? 'ring-2 ring-[color:var(--color-accent)]' : ''}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <DDayBadge days={ur.daysUntilBreach} />
            <GradeBadge grade={part.grade.amount} kind="금액" />
            <GradeBadge grade={part.grade.quantity} kind="수량" />
          </div>
          <div className="mt-1.5 truncate font-mono text-[15px] font-semibold text-ink tabular-nums">
            {part.partNo}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-ink-3">
            입고: {part.inboundVendor ?? '거래처 미상'} · {part.unit ?? '-'}
          </div>
        </div>
        <div className="shrink-0">
          <Sparkline
            values={stockLine}
            baseline={safetyLine}
            width={120}
            height={36}
            strokeColor="#0F172A"
            baselineColor={accentColor}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-2.5">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-3">부족 예측</div>
          <div className="num text-[15px] font-semibold leading-tight" style={{ color: accentColor }}>
            {formatInt(ur.projectedShortage)}
            <span className="ml-0.5 text-[10px] font-normal text-ink-3">{part.unit ?? ''}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-3">발주 금액</div>
          <div className="num text-[15px] font-semibold leading-tight text-ink">
            {formatCurrency(ur.requiredOrderAmount)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-3">breach 일자</div>
          <div className="num text-[15px] font-semibold leading-tight text-ink">
            {ur.breachDate ? formatShortDate(ur.breachDate) : '없음'}
          </div>
        </div>
      </div>

      {ur.reasonTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ur.reasonTags.map((t) => (
            <span
              key={t}
              className="rounded-sm bg-surface-muted px-1 py-0.5 text-[10px] uppercase tracking-wider text-ink-2"
            >
              {t.replace(/_/g, ' ').toLowerCase()}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

const UrgentWidget: React.FC<Props> = ({ topThree, partMap, dates, today, onPick, selectedPartNo }) => {
  if (topThree.length === 0) {
    return (
      <Card>
        <div className="text-sm text-ink-2">
          오늘 안에 발주가 필요한 부품이 없습니다. 30일 시뮬레이션에서 안전재고를 깨뜨리는 부품이
          탐지되지 않았습니다.
        </div>
      </Card>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {topThree.map((ur) => {
        const part = partMap.get(ur.partNo)
        if (!part) return null
        return (
          <UrgentCard
            key={ur.partNo}
            ur={ur}
            part={part}
            dates={dates}
            today={today}
            onPick={onPick}
            selected={selectedPartNo === ur.partNo}
          />
        )
      })}
    </div>
  )
}

export default UrgentWidget
