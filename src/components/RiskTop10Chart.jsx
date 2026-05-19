import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts'
import { formatNumber } from '../utils/formatters.js'

const GRADE_COLOR = {
  A: '#e11d48',
  B: '#0ea5e9',
  C: '#64748b'
}
const DEFAULT_COLOR = '#94a3b8'

const RiskTop10Chart = ({ parts, onSelect, selectedPartNo }) => {
  const data = useMemo(() => {
    const risks = (parts || []).filter((p) => p.isRisk && p.최대부족수량 > 0)
    risks.sort((a, b) => b.최대부족수량 - a.최대부족수량)
    return risks.slice(0, 10).map((p) => ({
      부품품번: p.부품품번,
      최대부족수량: p.최대부족수량,
      등급: p.meta.부품등급_금액 || '-'
    }))
  }, [parts])

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium text-slate-700">위험 부품 Top 10 (최대 부족수량)</div>
        <div className="py-10 text-center text-sm text-slate-400">
          표시할 위험 부품이 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">
          위험 부품 Top 10 <span className="text-xs text-slate-500">(최대 부족수량 기준)</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: GRADE_COLOR.A }} /> A
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: GRADE_COLOR.B }} /> B
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: GRADE_COLOR.C }} /> C
          </span>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => formatNumber(v)}
            />
            <YAxis
              type="category"
              dataKey="부품품번"
              tick={{ fontSize: 11, fill: '#334155', fontFamily: 'monospace' }}
              width={130}
            />
            <Tooltip
              formatter={(v, n, props) => [formatNumber(v), '최대 부족수량']}
              labelFormatter={(label, payload) => {
                const grade = payload && payload[0] && payload[0].payload.등급
                return `${label} · 등급 ${grade}`
              }}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="최대부족수량"
              cursor={onSelect ? 'pointer' : 'default'}
              onClick={(p) => onSelect && p && p.부품품번 && onSelect(p.부품품번)}
            >
              {data.map((d) => {
                const base = GRADE_COLOR[d.등급] || DEFAULT_COLOR
                const isSelected = selectedPartNo === d.부품품번
                return (
                  <Cell
                    key={d.부품품번}
                    fill={base}
                    fillOpacity={selectedPartNo && !isSelected ? 0.45 : 1}
                    stroke={isSelected ? '#1e293b' : 'none'}
                    strokeWidth={isSelected ? 1.5 : 0}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RiskTop10Chart
