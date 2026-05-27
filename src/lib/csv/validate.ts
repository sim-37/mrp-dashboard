// 추가 검증 (parse.ts가 이미 구분 누락/중복은 잡음. 여기는 구조 외 규칙.)

import type { CsvParseResult, ValidationError } from '../../types/mrp'

export const validateCsv = (result: CsvParseResult): { ok: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [...result.errors]

  if (result.parts.length === 0) {
    errors.push({
      severity: 'error',
      message: '부품 행이 한 건도 인식되지 않았습니다. 컬럼명을 확인해 주세요.',
    })
  }

  if (result.dates.length === 0) {
    errors.push({
      severity: 'error',
      message: "날짜 컬럼('1/1' 형식)을 한 개도 찾지 못했습니다.",
    })
  }

  const seen = new Set<string>()
  for (const p of result.parts) {
    if (seen.has(p.partNo)) {
      errors.push({
        partNo: p.partNo,
        severity: 'warning',
        message: '중복된 부품품번',
      })
    }
    seen.add(p.partNo)
  }

  const hasError = errors.some((e) => e.severity === 'error')
  return { ok: !hasError, errors }
}
