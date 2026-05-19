import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList
} from 'recharts'

const GRADES = ['A', 'B', 'C', '미분류']
const COLOR = {
  A: '#e11d48',
  B: '#0ea5e9',
  C: '#64748b',
  미분류: '#cbd5e1'
}

const GradeRiskChart = ({ parts }) => {
  const data = useMemo(() => {
    const totals = { A: 0, B: 0, C: 0, 미분류: 0 }
    const risks = { A: 0, B: 0, C: 0, 미분류: 0 }
    for (const p of parts || []) {
      const g = p.meta.부품등급_금액
      const key = g === 'A' || g === 'B' || g === 'C' ? g : '미분류'
      totals[key] += 1
      if (p.isRisk) risks[key] += 1
    }
    return GRADES.map((g) => ({
      grade: g,
      위험: risks[g],
      전체: totals[g],
      비율:
        totals[g] === 0 ? 0 : Math.round((risks[g] / totals[g]) * 1000) / 10
    }))
  }, [parts])

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-slate-700">
        ABC 등급별 위험 부품 수
        <span className="ml-2 text-xs text-slate-500">
          (부품등급_금액 기준 · 라벨은 위험률 %)
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 16, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="grade" tick={{ fontSize: 12, fill: '#334155' }} />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(v, n, props) => {
                if (n === '위험') {
                  const row = props && props.payload
                  return [
                    `${v.toLocaleString()} / ${row.전체.toLocaleString()} (${row.비율}%)`,
                    '위험 / 전체'
                  ]
                }
                return [v, n]
              }}
            />
            <Bar dataKey="위험">
              {data.map((d) => (
                <Cell key={d.grade} fill={COLOR[d.grade]} />
              ))}
              <LabelList
                dataKey="비율"
                position="top"
                formatter={(v) => (v > 0 ? `${v}%` : '')}
                style={{ fontSize: 11, fill: '#475569' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default GradeRiskChart
