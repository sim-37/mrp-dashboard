import React from 'react'
import { formatNumber, formatCurrency } from '../utils/formatters.js'

const Card = ({ label, value, sub, tone = 'slate' }) => {
  const toneMap = {
    slate: 'bg-white border-slate-200',
    red: 'bg-rose-50 border-rose-200',
    amber: 'bg-amber-50 border-amber-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    emerald: 'bg-emerald-50 border-emerald-200'
  }
  const valueTone = {
    slate: 'text-slate-900',
    red: 'text-rose-700',
    amber: 'text-amber-700',
    indigo: 'text-indigo-700',
    emerald: 'text-emerald-700'
  }
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneMap[tone]}`}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${valueTone[tone]}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

const KpiCards = ({ kpi }) => {
  if (!kpi) return null
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Card label="전체 부품 수" value={formatNumber(kpi.totalParts)} tone="slate" />
      <Card label="위험 부품 수" value={formatNumber(kpi.riskParts)} tone="red" />
      <Card label="A등급 위험 부품 수" value={formatNumber(kpi.riskAParts)} tone="amber" />
      <Card
        label="전체 부족수량"
        value={formatNumber(kpi.totalShortage)}
        sub="위험 부품 최대 부족수량 합"
        tone="indigo"
      />
      <Card
        label="예상 발주금액 합계"
        value={formatCurrency(kpi.expectedOrderAmount)}
        sub="최대 부족수량 × 단가"
        tone="emerald"
      />
    </div>
  )
}

export default KpiCards
