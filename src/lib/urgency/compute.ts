// 긴급도(Urgency) 엔진 — 단일 출처. 다른 곳에서 부족수량/D-day 재계산 금지.
//
// 알고리즘 (spec 2절):
//   1. today 시점 실재고 = stock[today] (없으면 plannedStock[today], 둘 다 없으면 0)
//   2. today+1 ~ today+30일 시뮬레이션:
//        next = prev + 입고 - 생산 - 결품 - 불량
//        future CSV가 있으면 그 값 사용. 없으면 최근 14일 평균으로 보간 (생산만; 입고는 0 가정).
//        ※ 발주예측은 "권고"일 뿐, 입고로 잡혀야 반영.
//   3. 처음으로 next < safety 가 되는 날 = breachDate.
//   4. 30일 안에 안 깨지면 breachDate = null.

import type { Part, UrgencyResult, ReasonTag, Grade, DailySeries } from '../../types/mrp'

export interface UrgencyOptions {
  horizonDays?: number
  /** 평균 소비량 보간을 위한 lookback 일수. 기본 14. */
  lookbackDays?: number
}

const DAY_MS = 86_400_000

const parseIso = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

const addDays = (iso: string, days: number): string => {
  const t = parseIso(iso).getTime() + days * DAY_MS
  const d = new Date(t)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const valueAt = (series: DailySeries, iso: string): number | null => {
  const v = series[iso]
  return v === undefined ? null : v
}

const num = (v: number | null | undefined): number => (v == null || !Number.isFinite(v) ? 0 : v)

const gradeOf = (part: Part): Grade | null =>
  part.grade.amount ?? part.grade.quantity ?? part.grade.unitPrice ?? null

const gradeWeight = (g: Grade | null): number => {
  if (g === 'A') return 1.5
  if (g === 'B') return 1.2
  return 1.0
}

const clamp = (lo: number, hi: number, x: number): number => Math.min(hi, Math.max(lo, x))

const recentMean = (series: DailySeries, today: string, lookback: number): number => {
  let sum = 0
  let n = 0
  for (let i = 1; i <= lookback; i++) {
    const d = addDays(today, -i)
    const v = valueAt(series, d)
    if (v != null) {
      sum += v
      n += 1
    }
  }
  return n === 0 ? 0 : sum / n
}

const recentStdOverMean = (series: DailySeries, today: string, lookback: number): number => {
  const samples: number[] = []
  for (let i = 1; i <= lookback; i++) {
    const d = addDays(today, -i)
    const v = valueAt(series, d)
    if (v != null) samples.push(v)
  }
  if (samples.length < 2) return 0
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  if (mean === 0) return 0
  const variance =
    samples.reduce((acc, x) => acc + (x - mean) * (x - mean), 0) / samples.length
  return Math.sqrt(variance) / mean
}

const isSingleVendor = (vendor: string | null): boolean => {
  if (!vendor) return false
  return vendor.split(/[,/;]+/).map((s) => s.trim()).filter(Boolean).length === 1
}

/**
 * 시작 재고: stock[today] 우선, 없으면 plannedStock[today], 그것도 없으면
 * 가장 가까운 과거의 stock 값을 carry-forward.
 */
const startStock = (part: Part, today: string): number => {
  const s = valueAt(part.series.stock, today)
  if (s != null) return s
  const p = valueAt(part.series.plannedStock, today)
  if (p != null) return p
  // 과거로 30일 carry-forward
  for (let i = 1; i <= 30; i++) {
    const d = addDays(today, -i)
    const sb = valueAt(part.series.stock, d)
    if (sb != null) return sb
    const pb = valueAt(part.series.plannedStock, d)
    if (pb != null) return pb
  }
  return 0
}

/**
 * 안전재고: today 값 우선, 없으면 가장 가까운 값 carry-forward.
 * 시뮬레이션 동안은 day-by-day로 다시 조회하되, 없으면 마지막 본 값 유지.
 */
const safetyAt = (part: Part, iso: string, fallback: number): number => {
  const v = valueAt(part.series.safetyStock, iso)
  return v == null ? fallback : v
}

const initialSafety = (part: Part, today: string): number => {
  const v = valueAt(part.series.safetyStock, today)
  if (v != null) return v
  for (let i = 1; i <= 30; i++) {
    const d = addDays(today, -i)
    const b = valueAt(part.series.safetyStock, d)
    if (b != null) return b
  }
  return 0
}

export const computeUrgency = (
  part: Part,
  today: string,
  options: UrgencyOptions = {},
): UrgencyResult => {
  const horizon = options.horizonDays ?? 30
  const lookback = options.lookbackDays ?? 14

  const starting = startStock(part, today)
  const safetyToday = initialSafety(part, today)

  const avgConsumption = recentMean(part.series.production, today, lookback)

  let projected = starting
  let minProjected = starting
  let breachDate: string | null = null
  let daysUntilBreach: number | null = null
  let lastSafety = safetyToday

  for (let offset = 1; offset <= horizon; offset++) {
    const d = addDays(today, offset)
    const inbound = num(valueAt(part.series.inbound, d))
    // 생산: CSV에 값이 있으면 그 값, 없으면 최근 평균 소비로 보간 (음의 변화량)
    const prodRaw = valueAt(part.series.production, d)
    const production = prodRaw == null ? avgConsumption : prodRaw
    const shortage = num(valueAt(part.series.shortage, d))
    const defect = num(valueAt(part.series.defect, d))

    projected = projected + inbound - production - shortage - defect
    minProjected = Math.min(minProjected, projected)

    lastSafety = safetyAt(part, d, lastSafety)

    if (breachDate == null && projected < lastSafety) {
      breachDate = d
      daysUntilBreach = offset
    }
  }

  const projectedShortage = Math.max(0, lastSafety - minProjected)

  const requiredOrderQty = Math.ceil(projectedShortage)
  const requiredOrderAmount = requiredOrderQty * (part.unitPrice || 0)

  // score
  const base =
    daysUntilBreach == null ? 0 : 100 * (1 / Math.max(1, daysUntilBreach))
  const g = gradeOf(part)
  const gw = gradeWeight(g)
  const amtWeight = Math.log10(1 + Math.max(0, requiredOrderAmount)) / 10
  const score = clamp(0, 100, base * gw + amtWeight * 5)

  // reasonTags
  const reasonTags: ReasonTag[] = []
  if (daysUntilBreach != null && daysUntilBreach <= 3) reasonTags.push('IMMINENT_BREACH')
  if (part.grade.amount === 'A') reasonTags.push('A_GRADE')

  let next7Inbound = 0
  for (let offset = 1; offset <= 7; offset++) {
    next7Inbound += num(valueAt(part.series.inbound, addDays(today, offset)))
  }
  if (next7Inbound === 0) reasonTags.push('NO_INBOUND')

  if (recentStdOverMean(part.series.production, today, lookback) >= 0.6) {
    reasonTags.push('HIGH_VARIANCE')
  }
  if (isSingleVendor(part.inboundVendor)) reasonTags.push('VENDOR_SINGLE')

  return {
    partNo: part.partNo,
    daysUntilBreach,
    breachDate,
    projectedShortage,
    requiredOrderQty,
    requiredOrderAmount,
    score,
    reasonTags,
    minProjectedStock: minProjected,
    startingStock: starting,
    safetyStock: safetyToday,
  }
}

export const rankParts = (
  parts: Part[],
  today: string,
  options?: UrgencyOptions,
): UrgencyResult[] => {
  const results = parts.map((p) => computeUrgency(p, today, options))
  results.sort((a, b) => {
    // breach가 있는 게 먼저, 그 안에서 score 내림차순
    const aB = a.daysUntilBreach != null ? 0 : 1
    const bB = b.daysUntilBreach != null ? 0 : 1
    if (aB !== bB) return aB - bB
    if (a.score !== b.score) return b.score - a.score
    return b.requiredOrderAmount - a.requiredOrderAmount
  })
  return results
}
