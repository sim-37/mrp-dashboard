import React from 'react'
import {
  formatNumber,
  formatCurrency,
  statusBadgeClass,
  gradeBadgeClass
} from '../utils/formatters.js'
import StockTrendChart from './StockTrendChart.jsx'

const Th = ({ children, className = '' }) => (
  <th
    className={`sticky top-0 z-10 whitespace-nowrap bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-600 ${className}`}
  >
    {children}
  </th>
)

const Td = ({ children, className = '', numeric }) => (
  <td
    className={`whitespace-nowrap px-3 py-1.5 text-sm text-slate-700 ${
      numeric ? 'tabular-nums text-right' : ''
    } ${className}`}
  >
    {children}
  </td>
)

const SummaryCard = ({ label, value, sub, tone = 'slate' }) => {
  const toneMap = {
    slate: 'bg-slate-50 border-slate-200',
    rose: 'bg-rose-50 border-rose-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    amber: 'bg-amber-50 border-amber-200',
    emerald: 'bg-emerald-50 border-emerald-200'
  }
  const valueTone = {
    slate: 'text-slate-800',
    rose: 'text-rose-700',
    indigo: 'text-indigo-700',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700'
  }
  return (
    <div className={`rounded-md border px-3 py-2 ${toneMap[tone]}`}>
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${valueTone[tone]}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  )
}

const DetailPanel = ({ part, onClose }) => {
  if (!part) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
        테이블의 행 또는 Top 10 차트의 막대를 클릭하면 해당 부품의 상세를 볼 수 있습니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 헤더 + 요약 카드 */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                선택된 부품
              </div>
              <div className="font-mono text-base font-semibold text-slate-800">
                {part.부품품번}
              </div>
            </div>
            <span
              className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                part.상태
              )}`}
            >
              {part.상태}
            </span>
            {part.meta.부품등급_금액 && (
              <span
                className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${gradeBadgeClass(
                  part.meta.부품등급_금액
                )}`}
              >
                금액 {part.meta.부품등급_금액}
              </span>
            )}
            <span className="text-xs text-slate-500">
              기준 재고: {part.stockBasisLabel || '없음'}
            </span>
            {part.meta.입고거래처 && (
              <span className="text-xs text-slate-500">
                입고처: {part.meta.입고거래처}
              </span>
            )}
            {part.meta.출고거래처 && (
              <span className="text-xs text-slate-500">
                출고처: {part.meta.출고거래처}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard
            label="위험 발생일"
            value={part.위험발생일 || '-'}
            sub={part.위험발생일 ? '기준 재고 < 안전재고 첫 일자' : '위험 일자 없음'}
            tone={part.위험발생일 ? 'rose' : 'slate'}
          />
          <SummaryCard
            label="최소 재고"
            value={formatNumber(part.최소재고)}
            sub={`단위: ${part.meta.단위 || '-'}`}
            tone="indigo"
          />
          <SummaryCard
            label="안전재고 기준"
            value={formatNumber(part.안전재고기준)}
            sub={
              part.위험발생일
                ? '위험 발생일 기준'
                : '최대 부족 일자 기준'
            }
            tone="amber"
          />
          <SummaryCard
            label="최대 부족수량"
            value={formatNumber(part.최대부족수량)}
            sub={`총 부족 누계: ${formatNumber(part.총부족수량)}`}
            tone="rose"
          />
          <SummaryCard
            label="예상 발주금액"
            value={formatCurrency(part.예상발주금액)}
            sub={`최대 부족수량 × 단가(${formatNumber(part.meta.단가)})`}
            tone="emerald"
          />
        </div>
      </div>

      {/* 추이 차트 */}
      <StockTrendChart part={part} />

      {/* 날짜별 상세 테이블 */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          날짜별 상세
          <span className="ml-2 text-xs text-slate-500">
            결품 컬럼은 참고용 — 위험 판단에는 사용하지 않음
          </span>
        </div>
        <div className="max-h-[40vh] overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>날짜</Th>
                <Th className="text-right">입고</Th>
                <Th className="text-right">생산</Th>
                <Th className="text-right">재고계획</Th>
                <Th className="text-right">재고</Th>
                <Th className="text-right">안전재고</Th>
                <Th className="text-right">발주예측</Th>
                <Th className="text-right">기준 재고</Th>
                <Th className="text-right">부족수량</Th>
                <Th className="text-right text-slate-400">결품(참고)</Th>
                <Th>상태</Th>
              </tr>
            </thead>
            <tbody>
              {part.daily.map((r) => (
                <tr key={r.date} className="border-t border-slate-100 hover:bg-slate-50">
                  <Td className="font-mono text-xs">{r.date}</Td>
                  <Td numeric>{formatNumber(r.입고)}</Td>
                  <Td numeric>{formatNumber(r.생산)}</Td>
                  <Td numeric>{r.재고계획 === null ? '-' : formatNumber(r.재고계획)}</Td>
                  <Td numeric>{r.재고 === null ? '-' : formatNumber(r.재고)}</Td>
                  <Td numeric>{formatNumber(r.안전재고)}</Td>
                  <Td numeric>{formatNumber(r.발주예측)}</Td>
                  <Td numeric className="font-semibold">
                    {formatNumber(r.기준재고)}
                  </Td>
                  <Td numeric className={r.부족수량 > 0 ? 'font-semibold text-rose-700' : ''}>
                    {formatNumber(r.부족수량)}
                  </Td>
                  <Td numeric className="text-slate-400">
                    {formatNumber(r.결품)}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                        r.상태
                      )}`}
                    >
                      {r.상태}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DetailPanel
