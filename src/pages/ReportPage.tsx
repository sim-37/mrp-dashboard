import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/store/useDataset'
import { rankParts } from '../lib/urgency/compute'
import DDayBadge from '../components/ui/DDayBadge'
import GradeBadge from '../components/ui/GradeBadge'
import { formatCurrency, formatInt, formatKrDate, formatShortDate } from '../lib/format'
import type { Part, UrgencyResult } from '../types/mrp'

const APP_VERSION = 'v3.0'
const APP_DATE = '2026-05-27'

/**
 * 개발이력 — semver 기준. 향후 항목 추가 가이드:
 *   - 새 PR이 머지되면 가장 윗줄에 추가.
 *   - 변경의 트리거(피드백/이슈)와 함께 기록.
 *   - 데이터 모델/긴급도 룰 변경 시 majorBump.
 */
const CHANGELOG = [
  {
    version: 'v3.0',
    date: '2026-05-27',
    headline:
      '발주 담당자용 “긴급 발주 헤드라인 위젯” 도입 (D-day 시뮬레이션). 4월 데이터를 실시간으로 가정.',
    items: [
      'TOP3 긴급 발주 카드 + 컴팩트 KPI 4종으로 상단바 재설계',
      '30일 시뮬레이션 기반 daysUntilBreach / projectedShortage / score 산출',
      '디자인 토큰화 (색·타이포·반경·그림자) + Stripe/Linear 무드',
      '월별 CSV 업로드 → IndexedDB 영속 → 동일 보고 자동 재생성',
      '보고서 페이지 + 개발이력 + 인쇄 친화 CSS',
    ],
    trigger: '기업체 피드백: “제일 급하게 안전재고를 떨어뜨릴 부품을 명확히 실시간으로”',
  },
  {
    version: 'v2.0',
    date: '2026-05 중',
    headline: '결품 컬럼 정합성 보정, 차트 드릴다운 추이 추가, 보고서 요약 개편.',
    items: ['결품 컬럼 NULL 처리 보정', '드릴다운 차트 30일 추이', 'KPI/위험 상위 차트 통합'],
    trigger: '내부 리뷰 피드백',
  },
  {
    version: 'v1.0',
    date: '2026-05 초',
    headline: 'MRP 기반 안전재고/발주예측 대시보드 초안.',
    items: ['KPI 5종', '부품 드릴다운', '보고서 요약'],
    trigger: '데이터 제공 기업의 기초 요건',
  },
]

const CSV_SPEC: Array<{ key: string; desc: string }> = [
  { key: 'NO', desc: '연속 번호 (메타)' },
  { key: '부품품번', desc: '부품 고유 ID. 같은 부품의 8행을 묶는 키' },
  { key: '부품등급_금액 / 단가 / 수량', desc: '각 차원의 ABC 등급' },
  { key: '4개월금액 / 단가 / 4개월수량', desc: '4개월 누적 합 및 단가' },
  { key: '입고거래처 / 출고거래처', desc: '거래처. 단일 거래처는 위험 가중 (VENDOR_SINGLE)' },
  { key: '단위', desc: 'EA 등' },
  { key: '구 분', desc: '입고 / 생산 / 결품 / 불량 / 발주예측 / 재고계획 / 재고 / 안전재고' },
  { key: '1/1, 1/2, …, 4/30', desc: '일별 수치. baseYear=2026' },
]

const URGENCY_RULES = [
  'startStock = stock[today] (없으면 plannedStock, 그것도 없으면 과거 carry-forward)',
  '시뮬레이션: prev + 입고 - 생산 - 결품 - 불량 → 처음 safety 깨지는 날 = breachDate',
  '발주예측은 “권고”일 뿐 시뮬레이션에 더하지 않는다. 입고로 잡혀야 반영.',
  'score = clamp(0, 100, 100/maxBreachDay × gradeWeight + 5 × log10(1 + amount)/10)',
  'reasonTags: IMMINENT_BREACH(D≤3), A_GRADE, NO_INBOUND(7일 입고 0), HIGH_VARIANCE(std/mean ≥ 0.6), VENDOR_SINGLE',
]

const SectionTitle: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div className="mb-2 border-b border-line pb-1">
    <h2 className="text-[14px] font-semibold tracking-tight text-ink">{children}</h2>
    {sub && <p className="mt-0.5 text-[11px] text-ink-3">{sub}</p>}
  </div>
)

const ReportPage: React.FC = () => {
  const { dataset, loading, error } = useDataset()

  const allUrgency = useMemo<UrgencyResult[]>(() => {
    if (!dataset) return []
    return rankParts(dataset.parts, dataset.meta.today)
  }, [dataset])

  const partMap = useMemo(() => {
    const m = new Map<string, Part>()
    if (dataset) for (const p of dataset.parts) m.set(p.partNo, p)
    return m
  }, [dataset])

  const risk = allUrgency.filter((u) => u.daysUntilBreach != null)
  const next3Days = risk.filter((u) => (u.daysUntilBreach ?? 99) <= 3)
  const totalShortage = risk.reduce((acc, u) => acc + u.projectedShortage, 0)
  const expectedOrderAmount = risk.reduce((acc, u) => acc + u.requiredOrderAmount, 0)
  const top10 = allUrgency.slice(0, 10)

  const handlePrint = () => window.print()

  return (
    <main className="mx-auto max-w-[1100px] space-y-6 px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-[11px] text-ink-3 hover:underline no-print">
              ← 대시보드
            </Link>
          </div>
          <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-ink">
            MRP 운영 보고서{' '}
            <span className="ml-1 text-[12px] font-normal text-ink-3">
              {APP_VERSION} · {APP_DATE}
            </span>
          </h1>
          {dataset && (
            <p className="mt-0.5 text-[12px] text-ink-2">
              데이터: <span className="num">{dataset.meta.filename}</span> · 기준일{' '}
              <span className="num">{formatKrDate(dataset.meta.today)}</span> · 부품{' '}
              <span className="num">{formatInt(dataset.meta.partCount)}</span>건
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="no-print rounded-sm border border-line bg-surface px-3 py-1.5 text-[12px] text-ink-2 hover:bg-surface-muted"
        >
          인쇄 / PDF
        </button>
      </header>

      {loading && <div className="text-[12px] text-ink-2">데이터 로딩 중…</div>}
      {error && <div className="text-[12px] text-[color:var(--color-danger-700)]">{error}</div>}

      {dataset && (
        <>
          <section>
            <SectionTitle sub="오늘 기준 위험 부품 수 · 권장 발주금액 · 3일 내 breach 부품">
              1. 운영 요약 (Executive Summary)
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-surface p-3 shadow-1" style={{ boxShadow: 'inset 0 0 0 1px var(--color-border), var(--shadow-1)' }}>
                <div className="text-[11px] uppercase tracking-wider text-ink-3">위험 부품</div>
                <div className="num mt-1 text-[20px] font-semibold text-[color:var(--color-danger-700)]">
                  {formatInt(risk.length)}
                </div>
              </div>
              <div className="rounded-md bg-surface p-3 shadow-1" style={{ boxShadow: 'inset 0 0 0 1px var(--color-border), var(--shadow-1)' }}>
                <div className="text-[11px] uppercase tracking-wider text-ink-3">3일 내 breach</div>
                <div className="num mt-1 text-[20px] font-semibold text-[color:var(--color-warn-600)]">
                  {formatInt(next3Days.length)}
                </div>
              </div>
              <div className="rounded-md bg-surface p-3 shadow-1" style={{ boxShadow: 'inset 0 0 0 1px var(--color-border), var(--shadow-1)' }}>
                <div className="text-[11px] uppercase tracking-wider text-ink-3">부족 예측 합</div>
                <div className="num mt-1 text-[20px] font-semibold text-ink">{formatInt(totalShortage)}</div>
              </div>
              <div className="rounded-md bg-surface p-3 shadow-1" style={{ boxShadow: 'inset 0 0 0 1px var(--color-border), var(--shadow-1)' }}>
                <div className="text-[11px] uppercase tracking-wider text-ink-3">권장 발주금액</div>
                <div className="num mt-1 text-[20px] font-semibold text-ink">
                  {formatCurrency(expectedOrderAmount)}
                </div>
              </div>
            </div>

            {next3Days.length > 0 && (
              <div className="mt-3 rounded-md border border-line bg-surface p-3 shadow-1">
                <h3 className="text-[12px] font-semibold tracking-tight text-ink">
                  3일 내 안전재고 breach 부품
                </h3>
                <ul className="mt-1 space-y-0.5 text-[12px]">
                  {next3Days.map((u) => {
                    const p = partMap.get(u.partNo)
                    return (
                      <li key={u.partNo} className="flex flex-wrap items-center gap-2">
                        <DDayBadge days={u.daysUntilBreach} />
                        <span className="num font-semibold text-ink">{u.partNo}</span>
                        <span className="text-ink-3">·</span>
                        <span className="num text-ink-2">
                          부족 {formatInt(u.projectedShortage)} {p?.unit ?? ''}
                        </span>
                        <span className="text-ink-3">·</span>
                        <span className="num text-ink-2">{formatCurrency(u.requiredOrderAmount)}</span>
                        <span className="text-ink-3">·</span>
                        <span className="text-ink-2">{p?.inboundVendor ?? '거래처 미상'}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>

          <section>
            <SectionTitle sub={`긴급도 점수 내림차순 (전체 ${formatInt(allUrgency.length)}건 중 상위 10건)`}>
              2. TOP 10 긴급 발주 부품
            </SectionTitle>
            <div className="overflow-auto rounded-md border border-line bg-surface shadow-1">
              <table className="w-full text-[12px]">
                <thead className="bg-surface-muted text-[11px] uppercase tracking-wider text-ink-3">
                  <tr>
                    <th className="px-2 py-1.5 text-left">순위</th>
                    <th className="px-2 py-1.5 text-left">부품</th>
                    <th className="px-2 py-1.5 text-left">등급</th>
                    <th className="px-2 py-1.5 text-left">D-day</th>
                    <th className="px-2 py-1.5 text-left">breach일</th>
                    <th className="px-2 py-1.5 text-right">부족 예측</th>
                    <th className="px-2 py-1.5 text-right">발주금액</th>
                    <th className="px-2 py-1.5 text-left">입고거래처</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map((u, i) => {
                    const p = partMap.get(u.partNo)
                    return (
                      <tr key={u.partNo} className="border-t border-line">
                        <td className="px-2 py-1.5 text-ink-3">{i + 1}</td>
                        <td className="px-2 py-1.5 font-mono font-semibold text-ink">{u.partNo}</td>
                        <td className="px-2 py-1.5">
                          <GradeBadge grade={p?.grade.amount ?? null} />
                        </td>
                        <td className="px-2 py-1.5">
                          <DDayBadge days={u.daysUntilBreach} />
                        </td>
                        <td className="px-2 py-1.5 num text-ink-2">
                          {u.breachDate ? formatShortDate(u.breachDate) : '-'}
                        </td>
                        <td className="px-2 py-1.5 num text-right text-ink">
                          {formatInt(u.projectedShortage)}
                        </td>
                        <td className="px-2 py-1.5 num text-right text-ink">
                          {formatCurrency(u.requiredOrderAmount)}
                        </td>
                        <td className="px-2 py-1.5 text-ink-2">{p?.inboundVendor ?? '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionTitle>3. 데이터 명세</SectionTitle>
            <div className="space-y-3">
              <div className="rounded-md border border-line bg-surface p-3 shadow-1">
                <h3 className="text-[12px] font-semibold tracking-tight text-ink">CSV 컬럼</h3>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-ink-2">
                  {CSV_SPEC.map((s) => (
                    <li key={s.key}>
                      <span className="font-mono text-ink">{s.key}</span> — {s.desc}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md border border-line bg-surface p-3 shadow-1">
                <h3 className="text-[12px] font-semibold tracking-tight text-ink">긴급도 산출 규칙</h3>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-ink-2">
                  {URGENCY_RULES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle sub="향후 라인은 PR이 머지될 때마다 가장 위에 추가합니다.">
              4. 개발 이력
            </SectionTitle>
            <ol className="space-y-3">
              {CHANGELOG.map((c) => (
                <li
                  key={c.version}
                  className="rounded-md border border-line bg-surface p-3 shadow-1"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="rounded-sm bg-[color:var(--color-accent)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      {c.version}
                    </span>
                    <span className="num text-[11px] text-ink-3">{c.date}</span>
                  </div>
                  <h3 className="mt-1 text-[13px] font-semibold tracking-tight text-ink">{c.headline}</h3>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-ink-2">
                    {c.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[11px] text-ink-3">트리거: {c.trigger}</p>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </main>
  )
}

export default ReportPage
