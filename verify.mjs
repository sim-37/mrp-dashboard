// 로직 sanity check: 실제 CSV에 대해 핵심 지표를 출력
import fs from 'node:fs'
import path from 'node:path'

// PapaParse가 npm 설치 전이라도 동작하도록, 간단 파서 사용 대신
// 정식 파서를 모사 — 헤더 행 + 라인 split, 따옴표 미사용 데이터 가정.
// (이 CSV는 따옴표 없는 단순 형식임을 head로 확인했다.)

const csvPath = path.resolve('public/mrp_sorted.csv')
const text = fs.readFileSync(csvPath, 'utf8')
const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
const headers = lines[0].replace(/^﻿/, '').split(',').map((h) => h.trim())

const rows = lines.slice(1).map((line) => {
  const cols = line.split(',')
  const obj = {}
  for (let i = 0; i < headers.length; i++) obj[headers[i]] = cols[i]
  return obj
})

const DATE_RE = /^\s*\d{1,2}\s*\/\s*\d{1,2}\s*$/
const dateColumns = headers
  .filter((h) => DATE_RE.test(h))
  .sort((a, b) => {
    const [am, ad] = a.split('/').map(Number)
    const [bm, bd] = b.split('/').map(Number)
    return am * 100 + ad - (bm * 100 + bd)
  })

console.log('headers:', headers.length, '| date cols:', dateColumns.length)
console.log('first date:', dateColumns[0], 'last date:', dateColumns[dateColumns.length - 1])

// 동적 import로 ESM utils 사용
const { parseCsvText } = await import('./src/utils/csvParser.js')
const { buildDashboardData, filterParts } = await import('./src/utils/mrpCalculator.js')

// PapaParse는 브라우저/노드 양쪽에서 동작하지만 노드 환경에서도 ESM 가능
const parsed = parseCsvText(text)
console.log('parsed rows:', parsed.rows.length, '| parsed date cols:', parsed.dateColumns.length)

const dashboard = buildDashboardData(parsed)
console.log('---')
console.log('KPI:', dashboard.kpi)
console.log('---')
console.log('Top 5 위험 부품:')
for (const p of dashboard.parts.slice(0, 5)) {
  console.log(
    `  [${p.순위}] ${p.부품품번} | 등급:${p.meta.부품등급_금액 || '-'} | 상태:${
      p.상태
    } | 위험일:${p.위험발생일 || '-'} | 최소재고:${p.최소재고} | 최대부족:${
      p.최대부족수량
    } | 예상발주: ${p.예상발주금액.toLocaleString()}`
  )
}

// 한 부품의 상세 일부 확인 (위험 발생일 주변)
const sample = dashboard.parts.find((p) => p.isRisk) || dashboard.parts[0]
if (sample) {
  console.log('---')
  console.log(`sample part ${sample.부품품번} 일부 일자별:`)
  const idx = sample.daily.findIndex((r) => r.상태 === '위험')
  const slice = sample.daily.slice(Math.max(0, idx - 2), idx + 3)
  for (const r of slice) {
    console.log(
      `  ${r.date}: 기준재고=${r.기준재고} 안전재고=${r.안전재고} 부족=${r.부족수량} 상태=${r.상태}`
    )
  }
}

// 필터 동작 확인
const filtered = filterParts(dashboard.parts, { keyword: '', grade: 'A', riskOnly: '위험' })
console.log('---')
console.log('A등급 + 위험 필터:', filtered.length)
