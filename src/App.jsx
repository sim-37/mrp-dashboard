import React, { useEffect, useMemo, useState } from 'react'
import { loadCsvFromUrl } from './utils/csvParser.js'
import { buildDashboardData, filterParts } from './utils/mrpCalculator.js'
import KpiCards from './components/KpiCards.jsx'
import FilterPanel from './components/FilterPanel.jsx'
import RiskTable from './components/RiskTable.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import RiskTop10Chart from './components/RiskTop10Chart.jsx'
import GradeRiskChart from './components/GradeRiskChart.jsx'
import ReportSummary from './components/ReportSummary.jsx'

const CSV_URL = '/mrp_sorted.csv'

const App = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [filters, setFilters] = useState({ keyword: '', grade: 'ALL', riskOnly: 'ALL' })
  const [selectedPartNo, setSelectedPartNo] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const parsed = await loadCsvFromUrl(CSV_URL)
        if (cancelled) return
        const data = buildDashboardData(parsed)
        setDashboard(data)
      } catch (e) {
        console.error(e)
        if (!cancelled) setError(e.message || String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredParts = useMemo(() => {
    if (!dashboard) return []
    return filterParts(dashboard.parts, filters)
  }, [dashboard, filters])

  const selectedPart = useMemo(() => {
    if (!dashboard || !selectedPartNo) return null
    return dashboard.partDetails.get(selectedPartNo) || null
  }, [dashboard, selectedPartNo])

  const handleSelect = (partNo) => {
    setSelectedPartNo((prev) => (prev === partNo ? null : partNo))
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <h1 className="text-xl font-semibold text-slate-800">
            MRP 기반 안전재고 대비 발주 예측 대시보드
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            2차 기능 · 차트 / 드릴다운 추이 / 보고서 요약 · 결품 컬럼은 참고용
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-4 px-6 py-6">
        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            CSV를 불러오는 중입니다...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            CSV 로딩 실패: {error}
            <div className="mt-1 text-xs text-rose-500">
              public/mrp_sorted.csv 파일이 존재하는지 확인해 주세요.
            </div>
          </div>
        )}

        {dashboard && (
          <>
            <KpiCards kpi={dashboard.kpi} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RiskTop10Chart
                  parts={dashboard.parts}
                  onSelect={handleSelect}
                  selectedPartNo={selectedPartNo}
                />
              </div>
              <div className="lg:col-span-1">
                <GradeRiskChart parts={dashboard.parts} />
              </div>
            </div>

            <FilterPanel
              filters={filters}
              onChange={setFilters}
              resultCount={filteredParts.length}
              totalCount={dashboard.parts.length}
            />

            <RiskTable
              parts={filteredParts}
              selectedPartNo={selectedPartNo}
              onSelect={handleSelect}
            />

            <DetailPanel part={selectedPart} onClose={() => setSelectedPartNo(null)} />

            <ReportSummary kpi={dashboard.kpi} dateColumns={dashboard.dateColumns} />

            <footer className="pb-6 pt-2 text-center text-xs text-slate-400">
              데이터 기간: {dashboard.dateColumns[0]} ~{' '}
              {dashboard.dateColumns[dashboard.dateColumns.length - 1]} ·{' '}
              {dashboard.dateColumns.length}일
            </footer>
          </>
        )}
      </main>
    </div>
  )
}

export default App
