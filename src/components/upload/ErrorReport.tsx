import React from 'react'
import type { ValidationError } from '../../types/mrp'

interface Props {
  errors: ValidationError[]
}

const ErrorReport: React.FC<Props> = ({ errors }) => {
  if (errors.length === 0) return null
  const errorRows = errors.filter((e) => e.severity === 'error')
  const warnRows = errors.filter((e) => e.severity === 'warning')

  const downloadReport = () => {
    const lines = ['severity,partNo,row,message']
    for (const e of errors) {
      const partNo = e.partNo ?? ''
      const row = e.row != null ? String(e.row) : ''
      const msg = (e.message || '').replace(/"/g, '""')
      lines.push(`${e.severity},${partNo},${row},"${msg}"`)
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mrp-validation-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-md border border-line bg-surface p-4 shadow-1">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold tracking-tight text-ink">
          검증 리포트{' '}
          <span className="ml-1 text-[11px] font-normal text-ink-3">
            오류 {errorRows.length} · 경고 {warnRows.length}
          </span>
        </h3>
        <button
          type="button"
          onClick={downloadReport}
          className="rounded-sm border border-line bg-surface-muted px-2 py-0.5 text-[11px] text-ink-2 hover:bg-surface"
        >
          리포트 CSV 다운로드
        </button>
      </div>
      <div className="mt-2 max-h-64 overflow-auto rounded-sm border border-line">
        <table className="w-full text-[12px]">
          <thead className="bg-surface-muted text-[11px] uppercase tracking-wider text-ink-3">
            <tr>
              <th className="px-2 py-1 text-left">심각도</th>
              <th className="px-2 py-1 text-left">부품</th>
              <th className="px-2 py-1 text-left">행</th>
              <th className="px-2 py-1 text-left">메시지</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((e, i) => (
              <tr key={i} className="border-t border-line">
                <td
                  className="px-2 py-1 text-[11px] font-semibold"
                  style={{
                    color:
                      e.severity === 'error'
                        ? 'var(--color-danger-600)'
                        : 'var(--color-warn-600)',
                  }}
                >
                  {e.severity === 'error' ? '오류' : '경고'}
                </td>
                <td className="px-2 py-1 font-mono">{e.partNo ?? '-'}</td>
                <td className="px-2 py-1 text-ink-3">{e.row ?? '-'}</td>
                <td className="px-2 py-1">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ErrorReport
