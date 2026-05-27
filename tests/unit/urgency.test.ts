import { describe, expect, it } from 'vitest'
import { computeUrgency, rankParts } from '../../src/lib/urgency/compute'
import type { Bucket, DailySeries, Part } from '../../src/types/mrp'

const emptySeries = (): Record<Bucket, DailySeries> => ({
  inbound: {},
  production: {},
  shortage: {},
  defect: {},
  forecast: {},
  plannedStock: {},
  stock: {},
  safetyStock: {},
})

// 작은 헬퍼: 'YYYY-MM-DD' 시작일에서 N일치 시퀀스에 동일값 채우기
const fillRange = (from: string, days: number, value: number): DailySeries => {
  const out: DailySeries = {}
  const [y, m, d] = from.split('-').map(Number)
  for (let i = 0; i < days; i++) {
    const t = Date.UTC(y, m - 1, d + i)
    const dt = new Date(t)
    const iso = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
    out[iso] = value
  }
  return out
}

const makePart = (overrides: Partial<Part> & { partNo: string }): Part => ({
  no: 1,
  partNo: overrides.partNo,
  grade: { amount: null, unitPrice: null, quantity: null },
  fourMonthAmount: 0,
  unitPrice: 1000,
  fourMonthQuantity: 0,
  inboundVendor: null,
  outboundVendor: null,
  unit: 'EA',
  series: emptySeries(),
  ...overrides,
})

describe('computeUrgency', () => {
  const today = '2026-04-30'

  it('재고가 충분하면 breach 없음', () => {
    const part = makePart({
      partNo: 'P-OK',
      series: {
        ...emptySeries(),
        stock: { '2026-04-30': 10000 },
        safetyStock: fillRange('2026-04-30', 31, 100),
        // 생산 거의 없음
        production: fillRange('2026-04-01', 60, 1),
      },
    })
    const r = computeUrgency(part, today)
    expect(r.breachDate).toBeNull()
    expect(r.daysUntilBreach).toBeNull()
    expect(r.projectedShortage).toBe(0)
  })

  it('소비량이 크면 며칠 내 breach (D-2 케이스)', () => {
    // 시작 재고 250, 안전재고 200, 일평균 생산 30
    // proj: d1=220, d2=190 (200 미만) → breach offset 2
    const part = makePart({
      partNo: 'P-D2',
      grade: { amount: 'A', unitPrice: 'A', quantity: 'A' },
      unitPrice: 5000,
      series: {
        ...emptySeries(),
        stock: { '2026-04-30': 250 },
        safetyStock: fillRange('2026-04-30', 31, 200),
        production: fillRange('2026-04-16', 15, 30), // 최근 14일 평균 30
      },
    })
    const r = computeUrgency(part, today)
    expect(r.daysUntilBreach).toBe(2)
    expect(r.breachDate).toBe('2026-05-02')
    expect(r.reasonTags).toContain('IMMINENT_BREACH')
    expect(r.reasonTags).toContain('A_GRADE')
    expect(r.requiredOrderQty).toBeGreaterThan(0)
    expect(r.requiredOrderAmount).toBeGreaterThan(0)
  })

  it('입고 스케줄이 있으면 breach 회피', () => {
    const part = makePart({
      partNo: 'P-INBOUND',
      series: {
        ...emptySeries(),
        stock: { '2026-04-30': 250 },
        safetyStock: fillRange('2026-04-30', 31, 200),
        production: fillRange('2026-04-16', 15, 30),
        inbound: { '2026-05-01': 5000 }, // 입고 충분 → 30일 내 회피
      },
    })
    const r = computeUrgency(part, today)
    expect(r.breachDate).toBeNull()
  })

  it('A등급은 동일 score base에서 가중치 1.5배', () => {
    // D-2 케이스로 base = 100/2 = 50 → clamp(100) 안 걸림
    const seriesA = {
      ...emptySeries(),
      stock: { '2026-04-30': 250 },
      safetyStock: fillRange('2026-04-30', 31, 200),
      production: fillRange('2026-04-16', 15, 30),
    }
    const a = makePart({
      partNo: 'P-A',
      grade: { amount: 'A', unitPrice: 'A', quantity: 'A' },
      series: seriesA,
    })
    const c = makePart({
      partNo: 'P-C',
      grade: { amount: 'C', unitPrice: 'C', quantity: 'C' },
      series: seriesA,
    })
    const ra = computeUrgency(a, today)
    const rc = computeUrgency(c, today)
    expect(ra.score).toBeGreaterThan(rc.score)
  })

  it('NO_INBOUND 태그: 향후 7일 입고 0', () => {
    const part = makePart({
      partNo: 'P-NOIN',
      series: {
        ...emptySeries(),
        stock: { '2026-04-30': 250 },
        safetyStock: fillRange('2026-04-30', 31, 200),
        production: fillRange('2026-04-16', 15, 30),
      },
    })
    const r = computeUrgency(part, today)
    expect(r.reasonTags).toContain('NO_INBOUND')
  })

  it('VENDOR_SINGLE 태그: 입고거래처 1개', () => {
    const part = makePart({
      partNo: 'P-VS',
      inboundVendor: '거래처A',
      series: {
        ...emptySeries(),
        stock: { '2026-04-30': 250 },
        safetyStock: fillRange('2026-04-30', 31, 200),
        production: fillRange('2026-04-16', 15, 30),
      },
    })
    const r = computeUrgency(part, today)
    expect(r.reasonTags).toContain('VENDOR_SINGLE')

    const multi = makePart({
      partNo: 'P-VM',
      inboundVendor: '거래처A, 거래처B',
      series: { ...emptySeries(), stock: { '2026-04-30': 250 }, safetyStock: fillRange('2026-04-30', 31, 200) },
    })
    expect(computeUrgency(multi, today).reasonTags).not.toContain('VENDOR_SINGLE')
  })

  it('HIGH_VARIANCE: 생산량 변동성이 큰 경우', () => {
    // 14일 중 절반은 0, 절반은 100 → std/mean ≥ 0.6
    const prod: DailySeries = {}
    for (let i = 1; i <= 14; i++) {
      prod[`2026-04-${String(30 - i + 1).padStart(2, '0')}`] = i % 2 === 0 ? 0 : 100
    }
    const part = makePart({
      partNo: 'P-HV',
      series: { ...emptySeries(), stock: { '2026-04-30': 500 }, safetyStock: fillRange('2026-04-30', 31, 100), production: prod },
    })
    const r = computeUrgency(part, today)
    expect(r.reasonTags).toContain('HIGH_VARIANCE')
  })

  it('rankParts: breach 있는 부품이 먼저, 그 안에서 score 내림차순', () => {
    const ok = makePart({
      partNo: 'P-OK',
      series: { ...emptySeries(), stock: { '2026-04-30': 10000 }, safetyStock: fillRange('2026-04-30', 31, 100) },
    })
    const d5 = makePart({
      partNo: 'P-D5',
      series: { ...emptySeries(), stock: { '2026-04-30': 250 }, safetyStock: fillRange('2026-04-30', 31, 200), production: fillRange('2026-04-16', 15, 12) },
    })
    const d2 = makePart({
      partNo: 'P-D2',
      grade: { amount: 'A', unitPrice: null, quantity: null },
      series: { ...emptySeries(), stock: { '2026-04-30': 250 }, safetyStock: fillRange('2026-04-30', 31, 200), production: fillRange('2026-04-16', 15, 30) },
    })
    const ranked = rankParts([ok, d5, d2], today)
    expect(ranked[0].partNo).toBe('P-D2')
    expect(ranked[1].partNo).toBe('P-D5')
    expect(ranked[2].partNo).toBe('P-OK')
  })
})
