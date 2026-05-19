// MRP 계산 엔진
//
// 입력: csvParser.parseCsvText 결과 ({ rows, dateColumns, metaColumns })
// 출력:
//   {
//     parts: PartSummary[],              // 정렬된 부품 요약 (테이블 행)
//     partDetails: Map<품번, PartDetail> // 드릴다운용 상세
//     kpi: { totalParts, riskParts, riskAParts, totalShortage, expectedOrderAmount }
//   }
//
// 위험 판단 규칙 (회의 결정 기반):
//   - 기준 재고 = 재고계획 (없으면 재고)
//   - 안전재고 = `구 분 = 안전재고` 행
//   - 위험: 기준 재고 < 안전재고
//   - 주의: 안전재고 <= 기준 재고 <= 안전재고 * 1.2
//   - 정상: 그 외
//   - 결품은 메인 판단에 사용하지 않음 (참고용 보관)

import { KNOWN_BUCKETS, toNumber } from './csvParser.js'

const SAFETY_WARNING_FACTOR = 1.2

// 단순 행 상태 분류
const classify = (basis, safety) => {
  if (basis < safety) return '위험'
  if (basis <= safety * SAFETY_WARNING_FACTOR) return '주의'
  return '정상'
}

// 부품 메타 정보를 첫 등장 행에서 뽑아 보관
const pickMeta = (row) => ({
  부품품번: (row['부품품번'] || '').trim(),
  부품등급_금액: (row['부품등급_금액'] || '').trim() || null,
  부품등급_단가: (row['부품등급_단가'] || '').trim() || null,
  부품등급_수량: (row['부품등급_수량'] || '').trim() || null,
  '4개월금액': toNumber(row['4개월금액']),
  단가: toNumber(row['단가']),
  '4개월수량': toNumber(row['4개월수량']),
  입고거래처: (row['입고거래처'] || '').trim() || null,
  출고거래처: (row['출고거래처'] || '').trim() || null,
  단위: (row['단위'] || '').trim() || null
})

// 등급 정렬 가중치 (A < B < C, null은 가장 뒤)
const gradeRank = (g) => {
  if (g === 'A') return 0
  if (g === 'B') return 1
  if (g === 'C') return 2
  return 3
}

/**
 * 부품별 / 구분별 / 날짜별 합산 맵을 만든다.
 * @returns Map<품번, { meta, series: Map<bucket, Map<dateCol, number>> }>
 */
const buildPartMap = (rows, dateColumns) => {
  const map = new Map()

  for (const row of rows) {
    const partNo = (row['부품품번'] || '').trim()
    if (!partNo) continue
    const bucket = (row['구 분'] || '').trim()
    if (!bucket) continue
    // 알려진 구분만 받는다 (오타/공백 방지)
    if (!KNOWN_BUCKETS.includes(bucket)) continue

    let entry = map.get(partNo)
    if (!entry) {
      entry = { meta: pickMeta(row), series: new Map() }
      map.set(partNo, entry)
    }

    let series = entry.series.get(bucket)
    if (!series) {
      series = new Map()
      entry.series.set(bucket, series)
    }

    // 같은 부품·같은 구분 행이 여러 개면 날짜별 합산
    for (const d of dateColumns) {
      const v = toNumber(row[d])
      if (v === 0 && !(d in row)) continue
      series.set(d, (series.get(d) || 0) + v)
    }
  }

  return map
}

/**
 * 단일 부품 분석.
 */
const analyzePart = (partNo, entry, dateColumns) => {
  const { meta, series } = entry
  const get = (bucket, date) => {
    const m = series.get(bucket)
    if (!m) return 0
    return m.get(date) || 0
  }

  const hasPlan = series.has('재고계획')
  const hasStock = series.has('재고')
  const stockBasisLabel = hasPlan ? '재고계획' : (hasStock ? '재고' : null)

  const daily = dateColumns.map((d) => {
    const stockPlan = get('재고계획', d)
    const stock = get('재고', d)
    const safety = get('안전재고', d)
    const basis = hasPlan ? stockPlan : stock
    const shortage = Math.max(0, safety - basis)
    return {
      date: d,
      입고: get('입고', d),
      생산: get('생산', d),
      재고계획: hasPlan ? stockPlan : null,
      재고: hasStock ? stock : null,
      안전재고: safety,
      발주예측: get('발주예측', d),
      불량: get('불량', d),
      결품: get('결품', d), // 참고용
      기준재고: basis,
      부족수량: shortage,
      상태: classify(basis, safety)
    }
  })

  // 위험 발생일: 기준 재고가 처음으로 안전재고보다 낮아진 날
  const firstRiskDay = daily.find((r) => r.상태 === '위험') || null

  // 최소 재고: 전체 기간 중 가장 낮은 기준 재고
  let minStock = Infinity
  let maxShortage = 0
  let safetyAtMaxShortage = 0
  let totalShortage = 0
  for (const r of daily) {
    if (r.기준재고 < minStock) minStock = r.기준재고
    if (r.부족수량 > maxShortage) {
      maxShortage = r.부족수량
      safetyAtMaxShortage = r.안전재고
    }
    totalShortage += r.부족수량
  }
  if (!Number.isFinite(minStock)) minStock = 0

  const expectedOrderAmount = maxShortage * (meta.단가 || 0)

  const overallStatus = firstRiskDay
    ? '위험'
    : (daily.some((r) => r.상태 === '주의') ? '주의' : '정상')

  return {
    부품품번: partNo,
    meta,
    stockBasisLabel,
    daily,
    위험발생일: firstRiskDay ? firstRiskDay.date : null,
    최소재고: minStock,
    안전재고기준: firstRiskDay ? firstRiskDay.안전재고 : safetyAtMaxShortage,
    최대부족수량: maxShortage,
    총부족수량: totalShortage,
    예상발주금액: expectedOrderAmount,
    상태: overallStatus,
    isRisk: overallStatus === '위험'
  }
}

const comparePartsForRanking = (a, b) => {
  // 1) 위험 우선
  if (a.isRisk !== b.isRisk) return a.isRisk ? -1 : 1
  // 2) 부품등급_금액 A > B > C
  const ga = gradeRank(a.meta.부품등급_금액)
  const gb = gradeRank(b.meta.부품등급_금액)
  if (ga !== gb) return ga - gb
  // 3) 최대 부족수량 큰 순
  if (b.최대부족수량 !== a.최대부족수량) return b.최대부족수량 - a.최대부족수량
  // 4) 예상 발주금액 큰 순
  if (b.예상발주금액 !== a.예상발주금액) return b.예상발주금액 - a.예상발주금액
  // 5) 4개월금액 큰 순
  if (b.meta['4개월금액'] !== a.meta['4개월금액']) return b.meta['4개월금액'] - a.meta['4개월금액']
  // 6) 단가 큰 순
  if (b.meta.단가 !== a.meta.단가) return b.meta.단가 - a.meta.단가
  // 7) 4개월수량 큰 순
  if (b.meta['4개월수량'] !== a.meta['4개월수량']) return b.meta['4개월수량'] - a.meta['4개월수량']
  return 0
}

/**
 * 메인 진입점: CSV 파싱 결과를 받아 대시보드용 데이터로 변환.
 */
export const buildDashboardData = ({ rows, dateColumns }) => {
  const partMap = buildPartMap(rows, dateColumns)

  const summaries = []
  const detailMap = new Map()
  for (const [partNo, entry] of partMap) {
    const analyzed = analyzePart(partNo, entry, dateColumns)
    summaries.push(analyzed)
    detailMap.set(partNo, analyzed)
  }

  summaries.sort(comparePartsForRanking)
  // 순위 부여
  summaries.forEach((p, i) => {
    p.순위 = i + 1
  })

  const kpi = summaries.reduce(
    (acc, p) => {
      acc.totalParts += 1
      if (p.isRisk) {
        acc.riskParts += 1
        if (p.meta.부품등급_금액 === 'A') acc.riskAParts += 1
        acc.totalShortage += p.최대부족수량
        acc.expectedOrderAmount += p.예상발주금액
      }
      return acc
    },
    {
      totalParts: 0,
      riskParts: 0,
      riskAParts: 0,
      totalShortage: 0,
      expectedOrderAmount: 0
    }
  )

  return { parts: summaries, partDetails: detailMap, kpi, dateColumns }
}

/**
 * 필터링: 검색어 / 등급 / 위험 여부.
 */
export const filterParts = (parts, { keyword, grade, riskOnly }) => {
  const kw = (keyword || '').trim().toLowerCase()
  return parts.filter((p) => {
    if (kw && !p.부품품번.toLowerCase().includes(kw)) return false
    if (grade && grade !== 'ALL' && p.meta.부품등급_금액 !== grade) return false
    if (riskOnly === '위험' && !p.isRisk) return false
    if (riskOnly === '정상' && p.isRisk) return false
    return true
  })
}
