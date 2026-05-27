// CSV → Part[] 파이프라인.
//
// 한 부품당 8행(입고/생산/결품/불량/발주예측/재고계획/재고/안전재고)을 묶어 series로 합성.
// 누락된 구분이 있으면 빈 DailySeries로 채움 (검증은 validate.ts).

import Papa from 'papaparse'
import type {
  CsvParseResult,
  DailySeries,
  Part,
  PartGrade,
  ValidationError,
  Bucket,
  Grade,
} from '../../types/mrp'
import {
  ALL_BUCKETS,
  BUCKET_KO,
  cleanHeader,
  isDateColumnName,
  toIsoDates,
  toNumber,
  toNumberOrNull,
} from './schema'

export interface ParseOptions {
  /** 'M/D' 컬럼의 기준 연도. CSV에 연도 메타가 없으므로 명시. 기본 2026. */
  baseYear?: number
}

const asGrade = (v: unknown): Grade | null => {
  const s = String(v ?? '').trim().toUpperCase()
  return s === 'A' || s === 'B' || s === 'C' ? s : null
}

const trimOrNull = (v: unknown): string | null => {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

const emptySeries = (): DailySeries => ({})

export const parseCsv = (text: string, options: ParseOptions = {}): CsvParseResult => {
  const baseYear = options.baseYear ?? 2026

  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: cleanHeader,
  })

  const rows = parsed.data || []
  const headers = (parsed.meta && parsed.meta.fields) || []
  const dateColumns = headers.filter(isDateColumnName)
  const { iso: isoDates, map: dateMap } = toIsoDates(dateColumns, baseYear)

  const errors: ValidationError[] = []
  const partsByNo = new Map<
    string,
    {
      meta: {
        no: number
        partNo: string
        grade: PartGrade
        fourMonthAmount: number
        unitPrice: number
        fourMonthQuantity: number
        inboundVendor: string | null
        outboundVendor: string | null
        unit: string | null
      }
      series: Record<Bucket, DailySeries>
      seenBuckets: Set<Bucket>
    }
  >()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const partNo = String(row['부품품번'] ?? '').trim()
    if (!partNo) continue
    const bucketKo = String(row['구 분'] ?? '').trim()
    const bucket: Bucket | undefined = BUCKET_KO[bucketKo]
    if (!bucket) {
      if (bucketKo !== '') {
        errors.push({
          partNo,
          row: i + 2, // header line + 1-index
          severity: 'warning',
          message: `알 수 없는 구분 컬럼 값: "${bucketKo}"`,
        })
      }
      continue
    }

    let entry = partsByNo.get(partNo)
    if (!entry) {
      const series: Record<Bucket, DailySeries> = {
        inbound: emptySeries(),
        production: emptySeries(),
        shortage: emptySeries(),
        defect: emptySeries(),
        forecast: emptySeries(),
        plannedStock: emptySeries(),
        stock: emptySeries(),
        safetyStock: emptySeries(),
      }
      entry = {
        meta: {
          no: Number(toNumber(row['NO'])) || 0,
          partNo,
          grade: {
            amount: asGrade(row['부품등급_금액']),
            unitPrice: asGrade(row['부품등급_단가']),
            quantity: asGrade(row['부품등급_수량']),
          },
          fourMonthAmount: toNumber(row['4개월금액']),
          unitPrice: toNumber(row['단가']),
          fourMonthQuantity: toNumber(row['4개월수량']),
          inboundVendor: trimOrNull(row['입고거래처']),
          outboundVendor: trimOrNull(row['출고거래처']),
          unit: trimOrNull(row['단위']),
        },
        series,
        seenBuckets: new Set<Bucket>(),
      }
      partsByNo.set(partNo, entry)
    }

    if (entry.seenBuckets.has(bucket)) {
      errors.push({
        partNo,
        row: i + 2,
        severity: 'warning',
        message: `중복된 구분 행 (${bucketKo}). 첫 행 기준으로 사용됨.`,
      })
      continue
    }
    entry.seenBuckets.add(bucket)

    for (const col of dateColumns) {
      const iso = dateMap.get(col)
      if (!iso) continue
      entry.series[bucket][iso] = toNumberOrNull(row[col])
    }
  }

  const parts: Part[] = []
  for (const entry of partsByNo.values()) {
    parts.push({
      ...entry.meta,
      series: entry.series,
    })
    for (const b of ALL_BUCKETS) {
      if (!entry.seenBuckets.has(b)) {
        errors.push({
          partNo: entry.meta.partNo,
          severity: 'warning',
          message: `구분 누락: ${b}`,
        })
      }
    }
  }

  parts.sort((a, b) => a.no - b.no || a.partNo.localeCompare(b.partNo))

  const today = isoDates.length ? isoDates[isoDates.length - 1] : ''

  return { parts, dates: isoDates, today, errors }
}
