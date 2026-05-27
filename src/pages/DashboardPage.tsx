import React, { useEffect, useMemo, useState } from 'react'
import KpiCards from '../components/KpiCards.jsx'
import FilterPanel from '../components/FilterPanel.jsx'
import RiskTable from '../components/RiskTable.jsx'
import DetailPanel from '../components/DetailPanel.jsx'
import RiskTop10Chart from '../components/RiskTop10Chart.jsx'
import GradeRiskChart from '../components/GradeRiskChart.jsx'
import { parseCsvText } from '../utils/csvParser.js'
import { buildDashboardData, filterParts } from '../utils/mrpCalculator.js'
import { rankParts } from '../lib/urgency/compute'
import { useDataset } from '../lib/store/useDataset'
import UrgentWidget from '../components/headline/UrgentWidget'
import CompactKpi from '../components/headline/CompactKpi'
import type { Part, UrgencyResult } from '../types/mrp'

const REFRESH_MS = 15_000

type LegacyDashboard = ReturnType<typeof buildDashboardData>

const DashboardPage: React.FC = () => {
  const { dataset, loading, error, reload, lastLoadedAt } = useDataset()
  const [filters, setFilters] = useState({ keyword: '', grade: 'ALL', riskOnly: 'ALL' })
  const [selectedPartNo, setSelectedPartNo] = useState<string | null>(null)

  // 15초 자동 갱신 (메모리 내 갱신; CSV는 같지만 today 인디케이터/시각 동기화 목적)
  useEffect(() => {
    const id = setInterval(() => reload(), REFRESH_MS)
    return () => clearInterval(id)
  }, [reload])

  const legacy: LegacyDashboard | null = useMemo(() => {
    if (!dataset) return null
    const parsed = parseCsvText(dataset.rawText)
    return buildDashboardData(parsed)
  }, [dataset])

  const partMap = useMemo(() => {
    const m = new Map<string, Part>()
    if (dataset) for (const p of dataset.parts) m.set(p.partNo, p)
    return m
  }, [dataset])

  const allUrgency = useMemo<UrgencyResult[]>(() => {
    if (!dataset) return []
    return rankParts(dataset.parts, dataset.meta.today)
  }, [dataset])

  const topThree = allUrgency.slice(0, 3)

  const compactKpi = useMemo(() => {
    const risk = allUrgency.filter((u) => u.daysUntilBreach != null)
    const totalShortage = risk.reduce((acc, u) => acc + u.projectedShortage, 0)
    const expectedOrderAmount = risk.reduce((acc, u) => acc + u.requiredOrderAmount, 0)
    return {
      totalParts: allUrgency.length,
      riskParts: risk.length,
      totalShortage,
      expectedOrderAmount,
    }
  }, [allUrgency])

  const filteredParts = useMemo(() => {
    if (!legacy) return []
    return filterParts(legacy.parts, filters)
  }, [legacy, filters])

  const selectedPart = useMemo(() => {
    if (!legacy || !selectedPartNo) return null
    return legacy.partDetails.get(selectedPartNo) || null
  }, [legacy, selectedPartNo])

  const handleSelect = (partNo: string) => {
    setSelectedPartNo((prev) => (prev === partNo ? null : partNo))
  }

  return (
    <main className="mx-auto max-w-[1400px] space-y-5 px-6 py-5">
      {loading && !dataset && (
        <div className="rounded-md border border-line bg-surface p-8 text-center text-sm text-ink-2 shadow-1">
          CSV를 불러오는 중입니다…
        </div>
      )}
      {error && (
        <div className="rounded-md border border-[color:var(--color-danger-500)]/30 bg-[color:var(--color-danger-50)] p-3 text-sm text-[color:var(--color-danger-700)]">
          데이터 로딩 실패: {error}
          <div className="mt-1 text-xs">public/mrp_sorted.csv를 확인해 주세요.</div>
        </div>
      )}

      {dataset && (
        <>
          <section aria-label="긴급 발주 헤드라인">
            <div className="mb-2 flex items-baseline justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight text-ink">
                  오늘 안에 발주가 필요한 부품
                </h2>
                <p className="mt-0.5 text-[12px] text-ink-2">
                  안전재고가 30일 안에 깨질 가능성을 시뮬레이션 한 순위입니다. 위험도가 가장 큰 3개를
                  먼저 보여드립니다.
                </p>
              </div>
              <div className="text-[11px] text-ink-3">
                {lastLoadedAt ? `${new Date(lastLoadedAt).toLocaleTimeString('ko-KR', { hour12: false })} 산출` : ''}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr,260px]">
              <UrgentWidget
                topThree={topThree}
                partMap={partMap}
                dates={dataset.dates}
                today={dataset.meta.today}
                onPick={handleSelect}
                selectedPartNo={selectedPartNo}
              />
              <CompactKpi {...compactKpi} />
            </div>
          </section>

          {legacy && (
            <>
              <section aria-label="요약 KPI" className="space-y-2">
                <h3 className="text-[12px] font-medium uppercase tracking-wider text-ink-3">
                  4개월 요약 — 정적 분석 (전체 기간)
                </h3>
                <KpiCards kpi={legacy.kpi} />
              </section>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <RiskTop10Chart
                    parts={legacy.parts}
                    onSelect={handleSelect}
                    selectedPartNo={selectedPartNo}
                  />
                </div>
                <div className="lg:col-span-1">
                  <GradeRiskChart parts={legacy.parts} />
                </div>
              </section>

              <FilterPanel
                filters={filters}
                onChange={setFilters}
                resultCount={filteredParts.length}
                totalCount={legacy.parts.length}
              />

              <RiskTable
                parts={filteredParts}
                selectedPartNo={selectedPartNo}
                onSelect={handleSelect}
              />

              <DetailPanel part={selectedPart} onClose={() => setSelectedPartNo(null)} />

              <footer className="pb-4 pt-1 text-center text-[11px] text-ink-3">
                데이터 기간: {legacy.dateColumns[0]} ~ {legacy.dateColumns[legacy.dateColumns.length - 1]} · {legacy.dateColumns.length}일
              </footer>
            </>
          )}
        </>
      )}
    </main>
  )
}

export default DashboardPage
