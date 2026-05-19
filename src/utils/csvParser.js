// CSV 파싱 유틸
//
// - PapaParse로 CSV를 읽고, 메타 컬럼 / 날짜 컬럼을 분리한다.
// - 날짜 컬럼 판정: '숫자/숫자' 형태 (예: 1/1, 2/15, 4/30)
// - 결과 반환:
//     { rows, dateColumns, metaColumns }

import Papa from 'papaparse'

// 알려진 메타 컬럼 후보 (CSV에 존재하는 것만 사용)
export const META_COLUMN_CANDIDATES = [
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
  '구 분'
]

export const KNOWN_BUCKETS = [
  '입고',
  '생산',
  '재고',
  '재고계획',
  '안전재고',
  '발주예측',
  '불량',
  '결품'
]

// '1/1', '12/31' 같은 형태인지 검사 — 그 외(공백, 메타명)는 무시
const DATE_PATTERN = /^\s*\d{1,2}\s*\/\s*\d{1,2}\s*$/

export const isDateColumnName = (name) => {
  if (typeof name !== 'string') return false
  return DATE_PATTERN.test(name)
}

// 'm/d' → 정렬 가능한 정수 (월*100 + 일). 잘못된 값은 Infinity로.
export const dateSortKey = (name) => {
  if (!isDateColumnName(name)) return Infinity
  const [m, d] = name.split('/').map((s) => Number(s.trim()))
  return m * 100 + d
}

// BOM(﻿) 제거 + 트림
const cleanHeader = (h) => (h || '').replace(/^﻿/, '').trim()

// 숫자 변환: 빈 문자열·undefined·null → 0
export const toNumber = (raw) => {
  if (raw === null || raw === undefined) return 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  const s = String(raw).trim()
  if (s === '' || s === '-' || s === 'NaN') return 0
  // 천 단위 콤마 제거
  const n = Number(s.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

/**
 * CSV 텍스트를 파싱한다.
 * @param {string} csvText
 * @returns {{ rows: object[], dateColumns: string[], metaColumns: string[] }}
 */
export const parseCsvText = (csvText) => {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: cleanHeader
  })

  const rows = parsed.data || []
  const headers = (parsed.meta && parsed.meta.fields) || []

  const dateColumns = headers
    .filter(isDateColumnName)
    .sort((a, b) => dateSortKey(a) - dateSortKey(b))

  const metaColumns = META_COLUMN_CANDIDATES.filter((c) => headers.includes(c))

  return { rows, dateColumns, metaColumns }
}

/**
 * URL에서 CSV를 fetch해서 파싱.
 */
export const loadCsvFromUrl = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`)
  const text = await res.text()
  return parseCsvText(text)
}
