import React, { useState, useMemo } from 'react'
import {
  formatNumber,
  formatCurrency,
  statusBadgeClass,
  gradeBadgeClass
} from '../utils/formatters.js'

const PAGE_SIZE = 50

const Th = ({ children, className = '' }) => (
  <th
    className={`sticky top-0 z-10 whitespace-nowrap bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-600 ${className}`}
  >
    {children}
  </th>
)

const Td = ({ children, className = '', numeric }) => (
  <td
    className={`whitespace-nowrap px-3 py-2 text-sm text-slate-700 ${
      numeric ? 'tabular-nums text-right' : ''
    } ${className}`}
  >
    {children}
  </td>
)

const RiskTable = ({ parts, selectedPartNo, onSelect }) => {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(parts.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)

  // 필터 결과가 줄어들 때 페이지 리셋
  const visible = useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return parts.slice(start, start + PAGE_SIZE)
  }, [parts, currentPage])

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div className="text-sm font-medium text-slate-700">위험 부품 테이블</div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
            disabled={currentPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ◀
          </button>
          <span className="tabular-nums">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            ▶
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>순위</Th>
              <Th>상태</Th>
              <Th>부품품번</Th>
              <Th>등급(금액)</Th>
              <Th>등급(단가)</Th>
              <Th>등급(수량)</Th>
              <Th className="text-right">4개월금액</Th>
              <Th className="text-right">단가</Th>
              <Th className="text-right">4개월수량</Th>
              <Th>위험 발생일</Th>
              <Th className="text-right">최소 재고</Th>
              <Th className="text-right">안전재고 기준</Th>
              <Th className="text-right">최대 부족수량</Th>
              <Th className="text-right">예상 발주금액</Th>
              <Th>입고거래처</Th>
              <Th>출고거래처</Th>
              <Th>단위</Th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={17} className="px-4 py-8 text-center text-sm text-slate-500">
                  표시할 부품이 없습니다.
                </td>
              </tr>
            )}
            {visible.map((p) => {
              const selected = p.부품품번 === selectedPartNo
              return (
                <tr
                  key={p.부품품번}
                  onClick={() => onSelect(p.부품품번)}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-indigo-50 ${
                    selected ? 'bg-indigo-50' : ''
                  }`}
                >
                  <Td numeric>{p.순위}</Td>
                  <Td>
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                        p.상태
                      )}`}
                    >
                      {p.상태}
                    </span>
                  </Td>
                  <Td className="font-mono text-xs">{p.부품품번}</Td>
                  <Td>
                    {p.meta.부품등급_금액 ? (
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${gradeBadgeClass(
                          p.meta.부품등급_금액
                        )}`}
                      >
                        {p.meta.부품등급_금액}
                      </span>
                    ) : (
                      '-'
                    )}
                  </Td>
                  <Td>{p.meta.부품등급_단가 || '-'}</Td>
                  <Td>{p.meta.부품등급_수량 || '-'}</Td>
                  <Td numeric>{formatCurrency(p.meta['4개월금액'])}</Td>
                  <Td numeric>{formatNumber(p.meta.단가)}</Td>
                  <Td numeric>{formatNumber(p.meta['4개월수량'])}</Td>
                  <Td>{p.위험발생일 || '-'}</Td>
                  <Td numeric>{formatNumber(p.최소재고)}</Td>
                  <Td numeric>{formatNumber(p.안전재고기준)}</Td>
                  <Td numeric className="font-semibold text-rose-700">
                    {formatNumber(p.최대부족수량)}
                  </Td>
                  <Td numeric className="font-semibold text-emerald-700">
                    {formatCurrency(p.예상발주금액)}
                  </Td>
                  <Td>{p.meta.입고거래처 || '-'}</Td>
                  <Td>{p.meta.출고거래처 || '-'}</Td>
                  <Td>{p.meta.단위 || '-'}</Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RiskTable
