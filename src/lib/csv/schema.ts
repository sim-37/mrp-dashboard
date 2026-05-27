// CSV 컬럼 스펙 — 한국어 → 영어 키 매핑은 여기서 단일 출처.
// 워커가 임의로 정규화하면 안 됨.

import type { Bucket } from '../../types/mrp'

export const META_COLUMNS = [
  'NO',
  '부품품번',
  '부품등급_금액',
  '부품등급_단가',
  '부품등급_수량',
  '4개월금액',
  '단가',
  '4개월수량',
  '입고거래처',
  '출고거래처',
  '단위',
  '구 분',
] as const

export const BUCKET_KO: Record<string, Bucket> = {
  입고: 'inbound',
  생산: 'production',
  결품: 'shortage',
  불량: 'defect',
  발주예측: 'forecast',
  재고계획: 'plannedStock',
  재고: 'stock',
  안전재고: 'safetyStock',
}

export const ALL_BUCKETS: Bucket[] = [
  'inbound',
  'production',
  'shortage',
  'defect',
  'forecast',
  'plannedStock',
  'stock',
  'safetyStock',
]

const DATE_PATTERN = /^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/

export const isDateColumnName = (name: string): boolean => DATE_PATTERN.test(name)

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n))

/**
 * 'M/D' 형식 컬럼명을 ISO 'YYYY-MM-DD' 로 변환.
 * 연 단위 롤오버 지원: monthSequence가 감소하면 baseYear+1로 넘어감.
 */
export const toIsoDates = (
  colNames: string[],
  baseYear = 2026,
): { iso: string[]; map: Map<string, string> } => {
  const sorted = colNames.filter(isDateColumnName)
  const out: string[] = []
  const map = new Map<string, string>()
  let year = baseYear
  let prevMonth = 0
  for (const c of sorted) {
    const m = c.match(DATE_PATTERN)
    if (!m) continue
    const month = Number(m[1])
    const day = Number(m[2])
    if (prevMonth > month) year += 1
    prevMonth = month
    const iso = `${year}-${pad2(month)}-${pad2(day)}`
    out.push(iso)
    map.set(c, iso)
  }
  return { iso: out, map }
}

/** 빈 문자열·undefined·null·NaN → null. 그 외 숫자 변환. */
export const toNumberOrNull = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  const s = String(raw).trim()
  if (s === '' || s === '-') return null
  const n = Number(s.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

/** 0으로 fold 하는 변형 (계산용). */
export const toNumber = (raw: unknown): number => toNumberOrNull(raw) ?? 0

/** BOM 제거 + 트림 */
export const cleanHeader = (h: string): string => (h || '').replace(/^﻿/, '').trim()
