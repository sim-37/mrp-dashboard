// 표시용 포매터 모음

export const formatNumber = (value, fractionDigits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })
}

export const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  // 1억 이상은 억 단위로, 1만 이상은 만 단위로 함께 표기
  if (Math.abs(n) >= 1e8) {
    return `${(n / 1e8).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억`
  }
  if (Math.abs(n) >= 1e4) {
    return `${(n / 1e4).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만`
  }
  return n.toLocaleString('ko-KR')
}

export const formatDate = (dateStr) => dateStr || '-'

export const statusBadgeClass = (status) => {
  switch (status) {
    case '위험':
      return 'bg-red-100 text-red-700 border border-red-200'
    case '주의':
      return 'bg-amber-100 text-amber-700 border border-amber-200'
    case '정상':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200'
  }
}

export const gradeBadgeClass = (grade) => {
  switch (grade) {
    case 'A':
      return 'bg-rose-100 text-rose-700 border border-rose-200'
    case 'B':
      return 'bg-sky-100 text-sky-700 border border-sky-200'
    case 'C':
      return 'bg-slate-100 text-slate-600 border border-slate-200'
    default:
      return 'bg-slate-50 text-slate-500 border border-slate-200'
  }
}
