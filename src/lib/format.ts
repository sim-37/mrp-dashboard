// 숫자/금액/날짜 포매터 — Intl.NumberFormat 단일 출처.

const nfInt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 })

export const formatInt = (v: number | null | undefined): string => {
  if (v == null || !Number.isFinite(v)) return '-'
  return nfInt.format(v)
}

export const formatNumber = (v: number | null | undefined, fractionDigits = 0): string => {
  if (v == null || !Number.isFinite(v)) return '-'
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(v)
}

export const formatCurrency = (v: number | null | undefined): string => {
  if (v == null || !Number.isFinite(v)) return '-'
  const n = Number(v)
  if (Math.abs(n) >= 1e8) {
    return `${(n / 1e8).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억`
  }
  if (Math.abs(n) >= 1e4) {
    return `${(n / 1e4).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만`
  }
  return nfInt.format(n)
}

export const formatCurrencyWon = (v: number | null | undefined): string => {
  if (v == null || !Number.isFinite(v)) return '-'
  return `${nfInt.format(v)}원`
}

const krOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', weekday: 'short' }
export const formatKrDate = (iso: string): string => {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('ko-KR', krOptions)
}

export const formatShortDate = (iso: string): string => {
  if (!iso) return '-'
  const [, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}`
}

export const formatRelativeDay = (days: number | null): string => {
  if (days == null) return '안전권'
  if (days <= 0) return 'D-0 (오늘)'
  return `D-${days}`
}
