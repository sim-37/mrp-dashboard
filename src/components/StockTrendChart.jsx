import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts'
import { formatNumber } from '../utils/formatters.js'

const tooltipFormatter = (value, name) => [formatNumber(value), name]

const StockTrendChart = ({ part }) => {
  const data = useMemo(() => {
    if (!part) return []
    return part.daily.map((r) => ({
      date: r.date,
      기준재고: r.기준재고,
      안전재고: r.안전재고,
      입고: r.입고,
      생산: r.생산
    }))
  }, [part])

  if (!part) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">
          날짜별 재고 추이
          <span className="ml-2 text-xs text-slate-500">
            기준 재고: {part.stockBasisLabel || '없음'}
          </span>
        </div>
        {part.위험발생일 && (
          <div className="text-xs text-rose-600">
            위험 발생일: <span className="font-semibold">{part.위험발생일}</span>
          </div>
        )}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval={Math.max(0, Math.floor(data.length / 12) - 1)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => formatNumber(v)}
              width={64}
            />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{ fontSize: 12 }}
              labelStyle={{ fontSize: 12, fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {part.위험발생일 && (
              <ReferenceLine
                x={part.위험발생일}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: '위험',
                  position: 'top',
                  fill: '#f43f5e',
                  fontSize: 11
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="기준재고"
              stroke="#4338ca"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="안전재고"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="입고"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="생산"
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default StockTrendChart
