import React from 'react'

const FilterPanel = ({ filters, onChange, resultCount, totalCount }) => {
  const update = (patch) => onChange({ ...filters, ...patch })

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-slate-600">
              부품품번 검색
            </label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => update({ keyword: e.target.value })}
              placeholder="예: ABQ30311803"
              className="w-64 rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-slate-600">
              부품등급_금액
            </label>
            <select
              value={filters.grade}
              onChange={(e) => update({ grade: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">전체</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-slate-600">
              위험 여부
            </label>
            <select
              value={filters.riskOnly}
              onChange={(e) => update({ riskOnly: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">전체</option>
              <option value="위험">위험</option>
              <option value="정상">정상</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-slate-500">
          {resultCount.toLocaleString()} / {totalCount.toLocaleString()} 건
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
