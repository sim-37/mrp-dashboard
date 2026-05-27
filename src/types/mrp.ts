// MRP 데이터/긴급도 타입 정의 — 단일 출처

export type Grade = 'A' | 'B' | 'C'

// 'YYYY-MM-DD' → 수량 (null = 데이터 없음, 0과 구분)
export type DailySeries = Record<string, number | null>

export type Bucket =
  | 'inbound'
  | 'production'
  | 'shortage'
  | 'defect'
  | 'forecast'
  | 'plannedStock'
  | 'stock'
  | 'safetyStock'

export interface PartGrade {
  amount: Grade | null
  unitPrice: Grade | null
  quantity: Grade | null
}

export interface Part {
  no: number
  partNo: string
  grade: PartGrade
  fourMonthAmount: number
  unitPrice: number
  fourMonthQuantity: number
  inboundVendor: string | null
  outboundVendor: string | null
  unit: string | null
  series: Record<Bucket, DailySeries>
}

export type ReasonTag =
  | 'IMMINENT_BREACH'
  | 'A_GRADE'
  | 'NO_INBOUND'
  | 'HIGH_VARIANCE'
  | 'VENDOR_SINGLE'

export interface UrgencyResult {
  partNo: string
  daysUntilBreach: number | null
  breachDate: string | null
  projectedShortage: number
  requiredOrderQty: number
  requiredOrderAmount: number
  score: number
  reasonTags: ReasonTag[]
  /** 시뮬레이션 30일간 최저 재고 */
  minProjectedStock: number
  /** 시뮬레이션 시작 시점 재고 */
  startingStock: number
  /** 안전재고 (시뮬레이션 첫날 기준) */
  safetyStock: number
}

export interface DatasetMeta {
  id: string
  uploadedAt: string
  filename: string
  partCount: number
  dateRange: { start: string; end: string }
  today: string
}

export interface ValidationError {
  partNo?: string
  message: string
  severity: 'error' | 'warning'
  row?: number
}

export interface CsvParseResult {
  parts: Part[]
  dates: string[] // ISO 'YYYY-MM-DD' 정렬됨
  today: string // 마지막 일자 (기준일)
  errors: ValidationError[]
}
