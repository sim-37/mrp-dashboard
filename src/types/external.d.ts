declare module '*.css'
declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'

// 기존 JS 컴포넌트의 ambient 모듈 (점진적 마이그레이션용)
declare module '*.jsx' {
  const Component: React.ComponentType<Record<string, unknown>>
  export default Component
}
declare module './utils/csvParser.js' {
  export const parseCsvText: (text: string) => {
    rows: Array<Record<string, unknown>>
    dateColumns: string[]
    metaColumns: string[]
  }
  export const loadCsvFromUrl: (url: string) => Promise<ReturnType<typeof parseCsvText>>
}
declare module './utils/mrpCalculator.js' {
  export interface LegacyKpi {
    totalParts: number
    riskParts: number
    riskAParts: number
    totalShortage: number
    expectedOrderAmount: number
  }
  export const buildDashboardData: (input: {
    rows: Array<Record<string, unknown>>
    dateColumns: string[]
  }) => {
    parts: unknown[]
    partDetails: Map<string, unknown>
    kpi: LegacyKpi
    dateColumns: string[]
  }
  export const filterParts: (
    parts: unknown[],
    filters: { keyword: string; grade: string; riskOnly: string },
  ) => unknown[]
}
declare module '../utils/csvParser.js' {
  export const parseCsvText: (text: string) => {
    rows: Array<Record<string, unknown>>
    dateColumns: string[]
    metaColumns: string[]
  }
}
declare module '../utils/mrpCalculator.js' {
  export interface LegacyKpi {
    totalParts: number
    riskParts: number
    riskAParts: number
    totalShortage: number
    expectedOrderAmount: number
  }
  export const buildDashboardData: (input: {
    rows: Array<Record<string, unknown>>
    dateColumns: string[]
  }) => {
    parts: unknown[]
    partDetails: Map<string, unknown>
    kpi: LegacyKpi
    dateColumns: string[]
  }
  export const filterParts: (
    parts: unknown[],
    filters: { keyword: string; grade: string; riskOnly: string },
  ) => unknown[]
}
